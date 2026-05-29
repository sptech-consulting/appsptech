import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/connection.js";
import { alunos, usuariosAdmin } from "../../db/schema/index.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  loginAdmin,
  loginAluno,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../../services/auth.service.js";

const loginBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
  role: z.enum(["admin", "aluno"]),
});

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "strict" as const,
  path: "/auth",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/login
  app.post(
    "/auth/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
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
  app.post("/auth/refresh", async (req, reply) => {
    const rawToken = req.cookies[COOKIE_NAME];
    if (!rawToken) {
      return reply.status(401).send({ statusCode: 401, error: "Unauthorized", message: "Refresh token ausente." });
    }

    const { accessToken, refreshToken } = await rotateRefreshToken(app, rawToken);

    reply.setCookie(COOKIE_NAME, refreshToken, COOKIE_OPTS);
    return reply.send({ accessToken });
  });

  // POST /auth/logout
  app.post("/auth/logout", async (req, reply) => {
    const rawToken = req.cookies[COOKIE_NAME];
    if (rawToken) await revokeRefreshToken(rawToken);
    reply.clearCookie(COOKIE_NAME, { path: "/auth" });
    return reply.status(204).send();
  });

  // GET /auth/me
  app.get("/auth/me", { preHandler: requireAuth }, async (req, reply) => {
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
  });
}
