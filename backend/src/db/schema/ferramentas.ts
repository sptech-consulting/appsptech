import {
  char,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
} from "drizzle-orm/mysql-core";

export const ferramentas = mysqlTable("ferramentas", {
  id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
  nome: text("nome").notNull(),
  subtitulo: text("subtitulo"),
  descricao: text("descricao"),
  descricaoLonga: text("descricao_longa"),
  url: text("url"),
  iconeUrl: text("icone_url"),
  imagemCapaUrl: text("imagem_capa_url"),
  fraseDestaque: text("frase_destaque"),
  categoria: text("categoria"),
  tipoAbertura: mysqlEnum("tipo_abertura", ["nova_aba", "mesma_aba", "modal"]).default("nova_aba"),
  status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  criadoPor: char("criado_por", { length: 36 }),
});

export const ferramentaCasosUso = mysqlTable(
  "ferramenta_casos_uso",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    ferramentaId: char("ferramenta_id", { length: 36 }).notNull(),
    texto: text("texto").notNull(),
    ordem: int("ordem").notNull().default(0),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_fcu_ferramenta").on(t.ferramentaId, t.ordem)],
);

export const ferramentaTags = mysqlTable(
  "ferramenta_tags",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    ferramentaId: char("ferramenta_id", { length: 36 }).notNull(),
    tipo: mysqlEnum("tipo", ["input", "output", "integracao"]).notNull(),
    rotulo: text("rotulo").notNull(),
    ordem: int("ordem").notNull().default(0),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_ft_ferramenta").on(t.ferramentaId, t.tipo, t.ordem)],
);

export const ferramentaBlocos = mysqlTable(
  "ferramenta_blocos",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    ferramentaId: char("ferramenta_id", { length: 36 }).notNull(),
    titulo: text("titulo").notNull(),
    conteudo: text("conteudo").notNull(),
    ordem: int("ordem").notNull().default(0),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_fb_ferramenta").on(t.ferramentaId, t.ordem)],
);

export const ferramentaFuncionalidades = mysqlTable(
  "ferramenta_funcionalidades",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    ferramentaId: char("ferramenta_id", { length: 36 }).notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    imagemUrl: text("imagem_url"),
    ordem: int("ordem").notNull().default(0),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_ff_ferramenta").on(t.ferramentaId, t.ordem)],
);

export const ferramentaCasosTeste = mysqlTable(
  "ferramenta_casos_teste",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    ferramentaId: char("ferramenta_id", { length: 36 }).notNull(),
    titulo: text("titulo").notNull(),
    badge: text("badge"),
    promptExemplo: text("prompt_exemplo"),
    explicacao: text("explicacao"),
    ordem: int("ordem").notNull().default(0),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_fct_ferramenta").on(t.ferramentaId, t.ordem)],
);
