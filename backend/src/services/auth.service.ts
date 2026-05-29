import { hash, verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/connection.js";
import { alunos, passwordResetTokens, refreshTokens, usuariosAdmin } from "../db/schema/index.js";
import type { JwtPayload } from "../plugins/jwt.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generic error used for both "user not found" and "wrong password"
// to prevent user enumeration via timing or message differences.
const INVALID_CREDENTIALS_MSG = "Credenciais inválidas.";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function loginAdmin(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const [user] = await db
    .select()
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.email, email.toLowerCase().trim()))
    .limit(1);

  // Always run verify even when user not found to prevent timing attacks
  const hashToCheck = user?.senhaHash ?? "$argon2id$v=19$m=65536,t=3,p=4$placeholder";
  const valid = await verify(hashToCheck, password);

  if (!user || !valid || user.status !== "ativo") {
    throw Object.assign(new Error(INVALID_CREDENTIALS_MSG), { statusCode: 401 });
  }

  await db
    .update(usuariosAdmin)
    .set({ ultimoAcessoEm: new Date() })
    .where(eq(usuariosAdmin.id, user.id));

  return issueTokenPair(app, user.id, "admin");
}

export async function loginAluno(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const [user] = await db
    .select()
    .from(alunos)
    .where(eq(alunos.emailAcesso, email.toLowerCase().trim()))
    .limit(1);

  const hashToCheck = user?.senhaHash ?? "$argon2id$v=19$m=65536,t=3,p=4$placeholder";
  const valid = await verify(hashToCheck, password);

  if (!user || !valid || user.status !== "ativo") {
    throw Object.assign(new Error(INVALID_CREDENTIALS_MSG), { statusCode: 401 });
  }

  return issueTokenPair(app, user.id, "aluno");
}

export async function issueTokenPair(
  app: FastifyInstance,
  userId: string,
  role: "admin" | "aluno",
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: JwtPayload = { id: userId, role };
  const accessToken = app.jwt.sign(payload);

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await db.insert(refreshTokens).values({
    tokenHash,
    usuarioId: userId,
    tipoUsuario: role,
    expiresAt,
  });

  return { accessToken, refreshToken: rawToken };
}

export async function rotateRefreshToken(
  app: FastifyInstance,
  rawToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenHash = sha256(rawToken);
  const now = new Date();

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!stored) {
    throw Object.assign(new Error("Refresh token inválido ou expirado."), { statusCode: 401 });
  }

  // Single-use: revoke immediately before issuing new pair
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(eq(refreshTokens.tokenHash, tokenHash));

  return issueTokenPair(app, stored.usuarioId, stored.tipoUsuario);
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = sha256(rawToken);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function createPasswordResetToken(
  userId: string,
  role: "admin" | "aluno",
): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({ tokenHash, usuarioId: userId, tipoUsuario: role, expiresAt });

  return rawToken;
}
