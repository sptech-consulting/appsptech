import {
  char,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
} from "drizzle-orm/mysql-core";

export const cursos = mysqlTable("cursos", {
  id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  capaUrl: text("capa_url"),
  categoria: text("categoria"),
  cargaHorariaMinutos: int("carga_horaria_minutos"),
  nivel: text("nivel"),
  status: mysqlEnum("status", ["rascunho", "publicada", "arquivada"]).notNull().default("rascunho"),
  criadoPor: char("criado_por", { length: 36 }),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});

export const modulos = mysqlTable(
  "modulos",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    cursoId: char("curso_id", { length: 36 }).notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    ordem: int("ordem").notNull().default(0),
    status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [index("idx_modulos_curso").on(t.cursoId, t.ordem)],
);

export const aulas = mysqlTable(
  "aulas",
  {
    id: char("id", { length: 36 }).primaryKey().default("(UUID())"),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    videoUrl: text("video_url"),
    materialUrl: text("material_url"),
    thumbnailUrl: text("thumbnail_url"),
    duracaoMinutos: int("duracao_minutos"),
    tipoConteudo: mysqlEnum("tipo_conteudo", [
      "video",
      "texto",
      "pdf",
      "link",
      "misto",
    ]).default("video"),
    status: mysqlEnum("status", ["rascunho", "publicada", "arquivada"]).notNull().default("rascunho"),
    moduloId: char("modulo_id", { length: 36 }),
    ordem: int("ordem").notNull().default(0),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    criadoPor: char("criado_por", { length: 36 }),
  },
  (t) => [index("idx_aulas_modulo").on(t.moduloId, t.ordem)],
);
