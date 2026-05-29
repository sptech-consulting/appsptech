import { and, eq, or } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/connection.js";
import {
  grupoPermissoes,
  permissoes,
  usuariosAdminGrupos,
} from "../db/schema/index.js";

/**
 * Factory that returns a preHandler checking a specific permission key.
 * Permission resolution is per-request — never cached across requests.
 *
 * Example: requirePermission("usuarios.criar")
 */
export function requirePermission(chave: string) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      reply.status(401).send({ statusCode: 401, error: "Unauthorized", message: "Não autenticado." });
      return;
    }

    const rows = await db
      .select({ chave: permissoes.chave })
      .from(usuariosAdminGrupos)
      .innerJoin(grupoPermissoes, eq(grupoPermissoes.grupoId, usuariosAdminGrupos.grupoId))
      .innerJoin(permissoes, eq(permissoes.id, grupoPermissoes.permissaoId))
      .where(
        and(
          eq(usuariosAdminGrupos.usuarioAdminId, userId),
          eq(permissoes.chave, chave),
          or(
            eq(usuariosAdminGrupos.acessoGlobal, true),
            // ambiente-scoped check is handled at route level for specific resources
          ),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      reply.status(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: `Permissão insuficiente: ${chave}`,
      });
    }
  };
}
