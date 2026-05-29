import { generateId } from "../generate-id.js";
import {
  char,
  datetime,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const alunos = mysqlTable("alunos", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  nomeCompleto: text("nome_completo").notNull(),
  emailAcesso: varchar("email_acesso", { length: 320 }).notNull().unique(),
  senhaHash: text("senha_hash"),
  whatsapp: varchar("whatsapp", { length: 20 }),
  status: mysqlEnum("status", ["ativo", "inativo", "bloqueado"]).notNull().default("ativo"),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});

export const importacoesAlunos = mysqlTable("importacoes_alunos", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  ambienteId: char("ambiente_id", { length: 36 }).notNull(),
  arquivoNome: text("arquivo_nome"),
  arquivoUrl: text("arquivo_url"),
  tipoArquivo: mysqlEnum("tipo_arquivo", ["csv", "xlsx"]),
  totalLinhas: int("total_linhas").default(0),
  totalImportados: int("total_importados").default(0),
  totalAtualizados: int("total_atualizados").default(0),
  totalErros: int("total_erros").default(0),
  status: mysqlEnum("status", [
    "pendente",
    "processando",
    "concluida",
    "com_erros",
    "falhou",
  ])
    .notNull()
    .default("pendente"),
  criadoPor: char("criado_por", { length: 36 }),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  finalizadoEm: datetime("finalizado_em", { mode: "date", fsp: 3 }),
});

export const importacoesAlunosErros = mysqlTable("importacoes_alunos_erros", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  importacaoId: char("importacao_id", { length: 36 }).notNull(),
  numeroLinha: int("numero_linha"),
  nomeCompleto: text("nome_completo"),
  emailAcesso: varchar("email_acesso", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  erro: text("erro"),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});
