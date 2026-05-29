import { db } from "../db/connection.js";
import { logsAuditoria } from "../db/schema/index.js";

type AuditParams = {
  usuarioAdminId?: string;
  ambienteId?: string;
  acao: string;
  entidade?: string;
  entidadeId?: string;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
  ip?: string;
};

export async function audit(params: AuditParams): Promise<void> {
  await db.insert(logsAuditoria).values({
    usuarioAdminId: params.usuarioAdminId,
    ambienteId: params.ambienteId,
    acao: params.acao,
    entidade: params.entidade,
    entidadeId: params.entidadeId,
    dadosAnteriores: params.dadosAnteriores,
    dadosNovos: params.dadosNovos,
    ip: params.ip,
  });
}
