import { generateId } from "../generate-id.js";
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
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const ambientes = mysqlTable(
  "ambientes",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    nome: text("nome").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    descricao: text("descricao"),
    status: mysqlEnum("status", ["ativo", "inativo", "rascunho", "arquivado"])
      .notNull()
      .default("rascunho"),
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    imagemCapaUrl: text("imagem_capa_url"),
    imagemLoginUrl: text("imagem_login_url"),
    corPrimaria: varchar("cor_primaria", { length: 20 }).default("#ED145B"),
    corSecundaria: varchar("cor_secundaria", { length: 20 }).default("#1F2A44"),
    corFundo: varchar("cor_fundo", { length: 20 }).default("#FFFFFF"),
    corTexto: varchar("cor_texto", { length: 20 }).default("#1F2A44"),
    corBotao: varchar("cor_botao", { length: 20 }).default("#ED145B"),
    corCard: varchar("cor_card", { length: 20 }).default("#FFFFFF"),
    corBorda: varchar("cor_borda", { length: 20 }).default("#D0D3D4"),
    tema: mysqlEnum("tema", ["claro", "escuro", "personalizado"]).notNull().default("claro"),
    layoutHome: json("layout_home").$type<Record<string, unknown>>().default({}),
    cardEstilo: mysqlEnum("card_estilo", ["flat", "sombra", "borda", "imagem"]).default("sombra"),
    cardBorda: mysqlEnum("card_borda", [
      "quadrado",
      "levemente_arredondado",
      "arredondado",
      "pill",
    ]).default("arredondado"),
    cardTamanho: mysqlEnum("card_tamanho", ["compacto", "medio", "grande"]).default("medio"),
    cardExibirIcone: boolean("card_exibir_icone").default(true),
    cardExibirImagem: boolean("card_exibir_imagem").default(true),
    cardSombra: boolean("card_sombra").default(true),
    efeitoCardTilt3d: boolean("efeito_card_tilt_3d").notNull().default(false),
    efeitoCardGlow: boolean("efeito_card_glow").notNull().default(false),
    efeitoCardScale: boolean("efeito_card_scale").notNull().default(false),
    efeitoBotaoLift: boolean("efeito_botao_lift").notNull().default(false),
    efeitoEntradaAnimada: boolean("efeito_entrada_animada").notNull().default(false),
    efeitoSomHover: boolean("efeito_som_hover").notNull().default(false),
    efeitoSomVolume: int("efeito_som_volume").notNull().default(40),
    efeitoBlobsFundo: boolean("efeito_blobs_fundo").notNull().default(false),
    webhookToken: varchar("webhook_token", { length: 255 }).unique(),
    codigoAcessoResultados: varchar("codigo_acesso_resultados", { length: 50 }).unique(),
    playbookTitulo: text("playbook_titulo"),
    playbookDescricao: text("playbook_descricao"),
    playbookCapaUrl: text("playbook_capa_url"),
    playbookArquivoUrl: text("playbook_arquivo_url"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    criadoPor: char("criado_por", { length: 36 }),
  },
  (t) => [index("idx_ambientes_status").on(t.status)],
);

export const ambienteFerramentas = mysqlTable(
  "ambiente_ferramentas",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    ferramentaId: char("ferramenta_id", { length: 36 }).notNull(),
    ordem: int("ordem").default(0),
    destaque: boolean("destaque").default(false),
    status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [unique("uq_amb_ferr").on(t.ambienteId, t.ferramentaId)],
);

export const ambienteAulas = mysqlTable(
  "ambiente_aulas",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    aulaId: char("aula_id", { length: 36 }).notNull(),
    ordem: int("ordem").default(0),
    moduloOrdem: int("modulo_ordem").default(0),
    liberado: boolean("liberado").default(true),
    dataLiberacao: datetime("data_liberacao", { mode: "date", fsp: 3 }),
    status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [unique("uq_amb_aula").on(t.ambienteId, t.aulaId)],
);

export const ambienteNovidades = mysqlTable(
  "ambiente_novidades",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    novidadeId: char("novidade_id", { length: 36 }).notNull(),
    destaque: boolean("destaque").default(false),
    ordem: int("ordem").default(0),
    status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [unique("uq_amb_nov").on(t.ambienteId, t.novidadeId)],
);

export const ambienteCursos = mysqlTable(
  "ambiente_cursos",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    cursoId: char("curso_id", { length: 36 }).notNull(),
    ordem: int("ordem").notNull().default(0),
    destaque: boolean("destaque").default(false),
    liberado: boolean("liberado").default(true),
    dataLiberacao: datetime("data_liberacao", { mode: "date", fsp: 3 }),
    status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [
    unique("uq_amb_curso").on(t.ambienteId, t.cursoId),
    index("idx_ambiente_cursos_amb").on(t.ambienteId, t.ordem),
  ],
);

export const ambienteAlunos = mysqlTable(
  "ambiente_alunos",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    alunoId: char("aluno_id", { length: 36 }).notNull(),
    status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
    origem: text("origem"),
    importacaoId: char("importacao_id", { length: 36 }),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [unique("uq_amb_aluno").on(t.ambienteId, t.alunoId)],
);
