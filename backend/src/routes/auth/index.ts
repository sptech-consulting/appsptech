import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/connection.js";
import { alunos, passwordResetTokens, usuariosAdmin } from "../../db/schema/index.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  createPasswordResetToken,
  hashPassword,
  loginAdmin,
  loginAluno,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../../services/auth.service.js";
import { sendPasswordResetEmail } from "../../services/email.service.js";
import { config } from "../../config.js";

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/auth",
  maxAge: 7 * 24 * 60 * 60,
};

const loginBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
  role: z.enum(["admin", "aluno"]),
});

const forgotBody = z.object({
  email: z.string().email().max(320),
  role: z.enum(["admin", "aluno"]),
});

const resetBody = z.object({
  token: z.string().length(64),
  newPassword: z.string().min(8).max(128),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/login
  app.post(
    "/auth/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        tags: ["Auth"],
        summary: "Login de admin ou aluno",
        body: {
          type: "object",
          required: ["email", "password", "role"],
          properties: {
            email: { type: "string", format: "email", maxLength: 320 },
            password: { type: "string", minLength: 1, maxLength: 128 },
            role: { type: "string", enum: ["admin", "aluno"] },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: { accessToken: { type: "string" } },
          },
        },
      },
    },
    async (req, reply) => {
      const { email, password, role } = loginBody.parse(req.body);
      const { accessToken, refreshToken } =
        role === "admin"
          ? await loginAdmin(app, email, password)
          : await loginAluno(app, email, password);
      reply.setCookie(COOKIE_NAME, refreshToken, COOKIE_OPTS);
      return reply.send({ accessToken });
    },
  );

  // POST /auth/refresh
  app.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Rotaciona o refresh token (single-use via cookie HttpOnly)",
      },
    },
    async (req, reply) => {
      const rawToken = req.cookies[COOKIE_NAME];
      if (!rawToken) {
        return reply.status(401).send({ statusCode: 401, error: "Unauthorized", message: "Refresh token ausente." });
      }
      const { accessToken, refreshToken } = await rotateRefreshToken(app, rawToken);
      reply.setCookie(COOKIE_NAME, refreshToken, COOKIE_OPTS);
      return reply.send({ accessToken });
    },
  );

  // POST /auth/logout
  app.post(
    "/auth/logout",
    { schema: { tags: ["Auth"], summary: "Revoga o refresh token e limpa o cookie" } },
    async (req, reply) => {
      const rawToken = req.cookies[COOKIE_NAME];
      if (rawToken) await revokeRefreshToken(rawToken);
      reply.clearCookie(COOKIE_NAME, { path: "/auth" });
      return reply.status(204).send();
    },
  );

  // GET /auth/me
  app.get(
    "/auth/me",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Auth"],
        summary: "Perfil do usuário autenticado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { id, role } = req.user;
      if (role === "admin") {
        const [user] = await db
          .select({ id: usuariosAdmin.id, nome: usuariosAdmin.nome, email: usuariosAdmin.email, status: usuariosAdmin.status })
          .from(usuariosAdmin)
          .where(eq(usuariosAdmin.id, id))
          .limit(1);
        if (!user) return reply.status(404).send({ message: "Usuário não encontrado." });
        return reply.send({ ...user, role });
      }
      const [user] = await db
        .select({ id: alunos.id, nomeCompleto: alunos.nomeCompleto, emailAcesso: alunos.emailAcesso, status: alunos.status })
        .from(alunos)
        .where(eq(alunos.id, id))
        .limit(1);
      if (!user) return reply.status(404).send({ message: "Usuário não encontrado." });
      return reply.send({ ...user, role });
    },
  );

  // POST /auth/forgot-password
  app.post(
    "/auth/forgot-password",
    {
      config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
      schema: {
        tags: ["Auth"],
        summary: "Solicita reset de senha — resposta idêntica independente do email existir",
        body: {
          type: "object",
          required: ["email", "role"],
          properties: {
            email: { type: "string", format: "email", maxLength: 320 },
            role: { type: "string", enum: ["admin", "aluno"] },
          },
          additionalProperties: false,
        },
        response: {
          200: { type: "object", properties: { message: { type: "string" } } },
        },
      },
    },
    async (req, reply) => {
      const { email, role } = forgotBody.parse(req.body);
      const normalizedEmail = email.toLowerCase().trim();

      // Look up user — but respond identically whether found or not
      const userId = await findUserIdByEmail(normalizedEmail, role);

      if (userId) {
        const rawToken = await createPasswordResetToken(userId, role);
        const resetUrl = `${config.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
        // Fire-and-forget — don't await so response time is consistent
        sendPasswordResetEmail(normalizedEmail, resetUrl).catch(() => {});
      }

      return reply.send({ message: "Se este email estiver cadastrado, você receberá as instruções em breve." });
    },
  );

  // POST /auth/reset-password
  app.post(
    "/auth/reset-password",
    {
      schema: {
        tags: ["Auth"],
        summary: "Redefine a senha usando o token recebido por email (single-use, expira em 1h)",
        body: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string", minLength: 64, maxLength: 64 },
            newPassword: { type: "string", minLength: 8, maxLength: 128 },
          },
          additionalProperties: false,
        },
        response: {
          200: { type: "object", properties: { message: { type: "string" } } },
        },
      },
    },
    async (req, reply) => {
      const { token, newPassword } = resetBody.parse(req.body);
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const now = new Date();

      const [stored] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, now),
          ),
        )
        .limit(1);

      if (!stored) {
        throw Object.assign(new Error("Token inválido ou expirado."), { statusCode: 400 });
      }

      const senhaHash = await hashPassword(newPassword);

      if (stored.tipoUsuario === "admin") {
        await db.update(usuariosAdmin).set({ senhaHash }).where(eq(usuariosAdmin.id, stored.usuarioId));
      } else {
        await db.update(alunos).set({ senhaHash }).where(eq(alunos.id, stored.usuarioId));
      }

      await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.tokenHash, tokenHash));

      return reply.send({ message: "Senha redefinida com sucesso." });
    },
  );
}

async function findUserIdByEmail(email: string, role: "admin" | "aluno"): Promise<string | null> {
  if (role === "admin") {
    const [u] = await db.select({ id: usuariosAdmin.id }).from(usuariosAdmin).where(eq(usuariosAdmin.email, email)).limit(1);
    return u?.id ?? null;
  }
  const [u] = await db.select({ id: alunos.id }).from(alunos).where(eq(alunos.emailAcesso, email)).limit(1);
  return u?.id ?? null;
}
