import { and, eq, or } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/connection.js";
import { usuariosAdminGrupos } from "../db/schema/index.js";

/**
 * Verifies the authenticated admin has access to the :ambienteId route param.
 * Passes if the admin has acesso_global=true in any group, OR has an explicit
 * scoped link to the requested ambiente.
 *
 * Must be used after requireAuth + requireAdmin.
 */
export async function requireAmbienteScope(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const adminId = req.user?.id;
  const { ambienteId } = req.params as { ambienteId?: string };

  if (!ambienteId) return;

  const rows = await db
    .select({ id: usuariosAdminGrupos.id })
    .from(usuariosAdminGrupos)
    .where(
      and(
        eq(usuariosAdminGrupos.usuarioAdminId, adminId),
        or(
          eq(usuariosAdminGrupos.acessoGlobal, true),
          eq(usuariosAdminGrupos.ambienteId, ambienteId),
        ),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    reply.status(403).send({
      statusCode: 403,
      error: "Forbidden",
      message: "Sem acesso a este ambiente.",
    });
  }
}
