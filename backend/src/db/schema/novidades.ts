import { generateId } from "../generate-id.js";
import {
  char,
  datetime,
  index,
  json,
  mysqlEnum,
  mysqlTable,
  text,
} from "drizzle-orm/mysql-core";

export const novidades = mysqlTable(
  "novidades",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    // ambiente_id: novidades are scoped to a single ambiente (migration 20260518170552)
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    titulo: text("titulo").notNull(),
    resumo: text("resumo"),
    conteudo: text("conteudo"),
    imagemUrl: text("imagem_url"),
    fonteNome: text("fonte_nome"),
    fonteUrl: text("fonte_url"),
    categoria: text("categoria"),
    // tags: stored as JSON array (TEXT[] not supported in MySQL)
    tags: json("tags").$type<string[]>().default([]),
    publicadoEm: datetime("publicado_em", { mode: "date", fsp: 3 }),
    status: mysqlEnum("status", ["rascunho", "publicada", "arquivada"]).notNull().default("rascunho"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    criadoPor: char("criado_por", { length: 36 }),
  },
  (t) => [index("idx_novidades_ambiente").on(t.ambienteId)],
);
