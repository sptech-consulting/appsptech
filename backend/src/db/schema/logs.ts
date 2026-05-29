import { generateId } from "../generate-id.js";
import { char, datetime, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export const logsAuditoria = mysqlTable("logs_auditoria", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  usuarioAdminId: char("usuario_admin_id", { length: 36 }),
  ambienteId: char("ambiente_id", { length: 36 }),
  acao: text("acao").notNull(),
  entidade: text("entidade"),
  entidadeId: char("entidade_id", { length: 36 }),
  dadosAnteriores: json("dados_anteriores").$type<Record<string, unknown>>(),
  dadosNovos: json("dados_novos").$type<Record<string, unknown>>(),
  ip: varchar("ip", { length: 45 }),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});
