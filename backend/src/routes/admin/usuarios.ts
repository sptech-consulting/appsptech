import { and, eq, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/connection.js";
import {
  alunos,
  gruposAcesso,
  usuariosAdmin,
  usuariosAdminGrupos,
} from "../../db/schema/index.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { audit } from "../../services/audit.service.js";
import { createPasswordResetToken } from "../../services/auth.service.js";
import { sendPasswordResetEmail } from "../../services/email.service.js";
import {
  isGlobalAdmin,
  isLastSuperAdmin,
  vinculoGrupoExists,
} from "../../services/rbac.service.js";
import { config } from "../../config.js";

const createBody = z.object({
  nome: z.string().min(1).max(255),
  email: z.string().email().max(320),
  // FIX: grupoIds removed from invite — prevents escalation where usuarios.criar
  // is used to assign Super Admin group without needing usuarios.vincular_grupo.
  // Groups are assigned separately via PATCH .../grupos.
});

const updateStatusBody = z.object({
  status: z.enum(["ativo", "inativo"]),
});

const updateGruposBody = z.object({
  grupoIds: z.array(z.string().uuid()),
  ambienteId: z.string().uuid().optional(),
  // FIX: acessoGlobal can only be set by a global admin — validated in handler.
  acessoGlobal: z.boolean().default(false),
});

const preHandlers = [requireAuth, requireAdmin];

export async function adminUsuariosRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/usuarios
  app.get(
    "/admin/usuarios",
    {
      preHandler: [...preHandlers, requirePermission("usuarios.visualizar")],
      schema: {
        tags: ["Admin — Usuários"],
        summary: "Lista todos os admins",
        security: [{ bearerAuth: [] }],
      },
    },
    async (_req, reply) => {
      const usuarios = await db
        .select({
          id: usuariosAdmin.id,
          nome: usuariosAdmin.nome,
          email: usuariosAdmin.email,
          status: usuariosAdmin.status,
          criadoEm: usuariosAdmin.criadoEm,
          ultimoAcessoEm: usuariosAdmin.ultimoAcessoEm,
        })
        .from(usuariosAdmin)
        .orderBy(usuariosAdmin.nome);

      return reply.send(usuarios);
    },
  );

  // POST /admin/usuarios
  app.post(
    "/admin/usuarios",
    {
      preHandler: [...preHandlers, requirePermission("usuarios.criar")],
      schema: {
        tags: ["Admin — Usuários"],
        summary: "Convida novo admin e envia email de definição de senha (sem atribuição de grupos)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "email"],
          properties: {
            nome: { type: "string", minLength: 1, maxLength: 255 },
            email: { type: "string", format: "email", maxLength: 320 },
          },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      const { nome, email } = createBody.parse(req.body);
      const normalizedEmail = email.toLowerCase().trim();

      const [alunoExistente] = await db
        .select({ id: alunos.id })
        .from(alunos)
        .where(eq(alunos.emailAcesso, normalizedEmail))
        .limit(1);

      if (alunoExistente) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: `O email ${normalizedEmail} já está cadastrado como aluno.`,
        });
      }

      const [existingAdmin] = await db
        .select({ id: usuariosAdmin.id })
        .from(usuariosAdmin)
        .where(eq(usuariosAdmin.email, normalizedEmail))
        .limit(1);

      if (existingAdmin) {
        return reply.status(409).send({
          statusCode: 409,
          error: "Conflict",
          message: `Já existe um admin com o email ${normalizedEmail}.`,
        });
      }

      await db.insert(usuariosAdmin).values({ nome, email: normalizedEmail, status: "ativo" });

      const [novoAdmin] = await db
        .select({ id: usuariosAdmin.id })
        .from(usuariosAdmin)
        .where(eq(usuariosAdmin.email, normalizedEmail))
        .limit(1);

      if (!novoAdmin) return reply.status(500).send({ message: "Erro ao criar usuário." });

      const rawToken = await createPasswordResetToken(novoAdmin.id, "admin");
      const resetUrl = `${config.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
      sendPasswordResetEmail(normalizedEmail, resetUrl).catch(() => {});

      await audit({
        usuarioAdminId: req.user.id,
        acao: "usuarios_admin.criar",
        entidade: "usuarios_admin",
        entidadeId: novoAdmin.id,
        dadosNovos: { nome, email: normalizedEmail },
        ip: req.ip,
      });

      return reply.status(201).send({ id: novoAdmin.id, nome, email: normalizedEmail });
    },
  );

  // PATCH /admin/usuarios/:id/status
  app.patch(
    "/admin/usuarios/:id/status",
    {
      preHandler: [...preHandlers, requirePermission("usuarios.editar")],
      schema: {
        tags: ["Admin — Usuários"],
        summary: "Ativa ou inativa um admin",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", pattern: "^[0-9a-f-]{36}$" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["status"],
          properties: { status: { type: "string", enum: ["ativo", "inativo"] } },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status } = updateStatusBody.parse(req.body);

      if (id === req.user.id) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Você não pode alterar o status da sua própria conta.",
        });
      }

      if (status === "inativo" && (await isLastSuperAdmin(id))) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Não é possível inativar o único Super Admin ativo do sistema.",
        });
      }

      const [antes] = await db
        .select({ status: usuariosAdmin.status })
        .from(usuariosAdmin)
        .where(eq(usuariosAdmin.id, id))
        .limit(1);

      if (!antes) return reply.status(404).send({ message: "Admin não encontrado." });

      await db.update(usuariosAdmin).set({ status }).where(eq(usuariosAdmin.id, id));

      await audit({
        usuarioAdminId: req.user.id,
        acao: "usuarios_admin.status",
        entidade: "usuarios_admin",
        entidadeId: id,
        dadosAnteriores: { status: antes.status },
        dadosNovos: { status },
        ip: req.ip,
      });

      return reply.send({ id, status });
    },
  );

  // PATCH /admin/usuarios/:id/grupos
  app.patch(
    "/admin/usuarios/:id/grupos",
    {
      preHandler: [...preHandlers, requirePermission("usuarios.vincular_grupo")],
      schema: {
        tags: ["Admin — Usuários"],
        summary: "Redefine os grupos de um admin (replace por escopo)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", pattern: "^[0-9a-f-]{36}$" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["grupoIds"],
          properties: {
            grupoIds: { type: "array", items: { type: "string", format: "uuid" } },
            ambienteId: { type: "string", format: "uuid" },
            acessoGlobal: { type: "boolean" },
          },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { grupoIds, ambienteId, acessoGlobal } = updateGruposBody.parse(req.body);
      const callerId = req.user.id;
      const callerIsGlobal = await isGlobalAdmin(callerId);

      // FIX Vetor 2 — auto-escalada: bloqueia acessoGlobal=true se caller não é global admin
      if (acessoGlobal && !callerIsGlobal) {
        return reply.status(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: "Apenas admins com acesso global podem conceder acesso_global a outros.",
        });
      }

      // FIX Vetor 2 — bloqueia atribuição de grupos com escopo=global se caller não é global admin
      if (grupoIds.length > 0 && !callerIsGlobal) {
        const globalGroups = await db
          .select({ id: gruposAcesso.id })
          .from(gruposAcesso)
          .where(and(eq(gruposAcesso.escopo, "global")));

        const globalGroupIds = new Set(globalGroups.map((g) => g.id));
        const tryingGlobal = grupoIds.some((gId) => globalGroupIds.has(gId));

        if (tryingGlobal) {
          return reply.status(403).send({
            statusCode: 403,
            error: "Forbidden",
            message: "Apenas admins com acesso global podem atribuir grupos de escopo global.",
          });
        }
      }

      const [admin] = await db
        .select({ id: usuariosAdmin.id })
        .from(usuariosAdmin)
        .where(eq(usuariosAdmin.id, id))
        .limit(1);

      if (!admin) return reply.status(404).send({ message: "Admin não encontrado." });

      if (grupoIds.length === 0 && (await isLastSuperAdmin(id))) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Não é possível remover todos os grupos do único Super Admin ativo.",
        });
      }

      await db
        .delete(usuariosAdminGrupos)
        .where(
          and(
            eq(usuariosAdminGrupos.usuarioAdminId, id),
            ambienteId
              ? eq(usuariosAdminGrupos.ambienteId, ambienteId)
              : isNull(usuariosAdminGrupos.ambienteId),
          ),
        );

      for (const grupoId of grupoIds) {
        if (await vinculoGrupoExists(id, grupoId, ambienteId ?? null)) continue;
        await db.insert(usuariosAdminGrupos).values({
          usuarioAdminId: id,
          grupoId,
          ambienteId: ambienteId ?? undefined,
          acessoGlobal,
        });
      }

      await audit({
        usuarioAdminId: callerId,
        acao: "usuarios_admin.grupos",
        entidade: "usuarios_admin",
        entidadeId: id,
        dadosNovos: { grupoIds, ambienteId, acessoGlobal },
        ip: req.ip,
      });

      return reply.send({ id, grupoIds });
    },
  );

  // POST /admin/usuarios/:id/reset-password
  app.post(
    "/admin/usuarios/:id/reset-password",
    {
      preHandler: [...preHandlers, requirePermission("usuarios.editar")],
      schema: {
        tags: ["Admin — Usuários"],
        summary: "Envia email de reset de senha para um admin",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string", pattern: "^[0-9a-f-]{36}$" } },
          required: ["id"],
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const [admin] = await db
        .select({ id: usuariosAdmin.id, email: usuariosAdmin.email })
        .from(usuariosAdmin)
        .where(eq(usuariosAdmin.id, id))
        .limit(1);

      if (!admin) return reply.status(404).send({ message: "Admin não encontrado." });

      const rawToken = await createPasswordResetToken(admin.id, "admin");
      const resetUrl = `${config.FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
      sendPasswordResetEmail(admin.email, resetUrl).catch(() => {});

      await audit({
        usuarioAdminId: req.user.id,
        acao: "usuarios_admin.reset_password",
        entidade: "usuarios_admin",
        entidadeId: id,
        ip: req.ip,
      });

      return reply.send({ message: "Email de reset enviado." });
    },
  );
}
