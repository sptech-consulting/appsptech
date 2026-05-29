import {
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
} from "drizzle-orm/mysql-core";

export const trabalhos = mysqlTable(
  "trabalhos",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    titulo: text("titulo").notNull(),
    subtitulo: text("subtitulo"),
    resumo: text("resumo"),
    conteudo: text("conteudo"),
    autorNome: text("autor_nome").notNull(),
    turma: text("turma"),
    imagemCapaUrl: text("imagem_capa_url"),
    linkExterno: text("link_externo"),
    // tags stored as JSON array (TEXT[] not supported in MySQL)
    tags: json("tags").$type<string[]>().default([]),
    status: mysqlEnum("status", ["rascunho", "publicada", "arquivada"]).notNull().default("rascunho"),
    destaque: boolean("destaque").notNull().default(false),
    ordem: int("ordem").notNull().default(0),
    publicadoEm: datetime("publicado_em", { mode: "date", fsp: 3 }),
    visualizacoes: int("visualizacoes").notNull().default(0),
    apresentacaoTipo: mysqlEnum("apresentacao_tipo", [
      "video",
      "pptx",
      "imagem",
      "documento",
      "link",
    ]),
    apresentacaoUrl: text("apresentacao_url"),
    apresentacaoTitulo: text("apresentacao_titulo"),
    apresentacaoDescricao: text("apresentacao_descricao"),
    apresentacaoImagemUrl: text("apresentacao_imagem_url"),
    aplicacaoExpectativa: text("aplicacao_expectativa"),
    criadoPor: char("criado_por", { length: 36 }),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_trabalhos_ambiente").on(t.ambienteId, t.status, t.ordem)],
);

export const trabalhoFuncionalidades = mysqlTable(
  "trabalho_funcionalidades",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    trabalhoId: char("trabalho_id", { length: 36 }).notNull(),
    ordem: int("ordem").notNull().default(0),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    imagemUrl: text("imagem_url"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_trabalho_func_trab").on(t.trabalhoId, t.ordem)],
);

export const trabalhoLinks = mysqlTable(
  "trabalho_links",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    trabalhoId: char("trabalho_id", { length: 36 }).notNull(),
    ordem: int("ordem").notNull().default(0),
    rotulo: text("rotulo").notNull(),
    url: text("url").notNull(),
    iconeUrl: text("icone_url"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_trabalho_links_trab").on(t.trabalhoId, t.ordem)],
);
