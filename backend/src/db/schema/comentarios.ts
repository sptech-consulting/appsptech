import { generateId } from "../generate-id.js";
import {
  char,
  datetime,
  index,
  int,
  mysqlTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const aulaComentarios = mysqlTable(
  "aula_comentarios",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    aulaId: char("aula_id", { length: 36 }).notNull(),
    ambienteId: char("ambiente_id", { length: 36 }).notNull(),
    alunoId: char("aluno_id", { length: 36 }),
    usuarioAdminId: char("usuario_admin_id", { length: 36 }),
    parentId: char("parent_id", { length: 36 }),
    // max length enforced here and at route schema level
    conteudo: varchar("conteudo", { length: 4000 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ativo"),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [
    index("idx_aula_coment_aula").on(t.aulaId, t.criadoEm),
    index("idx_aula_coment_parent").on(t.parentId),
  ],
);

export const aulaComentarioCurtidas = mysqlTable(
  "aula_comentario_curtidas",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    comentarioId: char("comentario_id", { length: 36 }).notNull(),
    alunoId: char("aluno_id", { length: 36 }),
    usuarioAdminId: char("usuario_admin_id", { length: 36 }),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [
    unique("uniq_aluno_curtida").on(t.comentarioId, t.alunoId),
    unique("uniq_admin_curtida").on(t.comentarioId, t.usuarioAdminId),
  ],
);

export const aulaProgresso = mysqlTable(
  "aluno_aula_progresso",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    alunoId: char("aluno_id", { length: 36 }).notNull(),
    aulaId: char("aula_id", { length: 36 }).notNull(),
    concluida: char("concluida", { length: 1 }).notNull().default("0"),
    concluidaEm: datetime("concluida_em", { mode: "date", fsp: 3 }),
    segundosAssistidos: int("segundos_assistidos").notNull().default(0),
    atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [unique("uq_aluno_aula").on(t.alunoId, t.aulaId)],
);
