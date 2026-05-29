import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/connection.js";
import { usuariosAdmin } from "../db/schema/index.js";

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    reply.status(401).send({ statusCode: 401, error: "Unauthorized", message: "Não autenticado." });
    return;
  }

  const [admin] = await db
    .select({ id: usuariosAdmin.id, status: usuariosAdmin.status })
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.id, userId))
    .limit(1);

  if (!admin || admin.status !== "ativo") {
    reply.status(403).send({ statusCode: 403, error: "Forbidden", message: "Acesso negado." });
  }
}
