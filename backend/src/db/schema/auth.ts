import { generateId } from "../generate-id.js";
import {
  boolean,
  char,
  datetime,
  mysqlEnum,
  mysqlTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const usuariosAdmin = mysqlTable("usuarios_admin", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  nome: text("nome").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  senhaHash: text("senha_hash"),
  status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  ultimoAcessoEm: datetime("ultimo_acesso_em", { mode: "date", fsp: 3 }),
});

export const gruposAcesso = mysqlTable("grupos_acesso", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  nome: varchar("nome", { length: 255 }).notNull().unique(),
  descricao: text("descricao"),
  escopo: mysqlEnum("escopo", ["global", "ambiente"]).notNull().default("ambiente"),
  status: mysqlEnum("status", ["ativo", "inativo"]).notNull().default("ativo"),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  atualizadoEm: datetime("atualizado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});

export const permissoes = mysqlTable("permissoes", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  modulo: varchar("modulo", { length: 100 }).notNull(),
  descricao: text("descricao"),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});

export const grupoPermissoes = mysqlTable(
  "grupo_permissoes",
  {
    id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
    grupoId: char("grupo_id", { length: 36 }).notNull(),
    permissaoId: char("permissao_id", { length: 36 }).notNull(),
    criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
  },
  (t) => [unique("uq_grupo_perm").on(t.grupoId, t.permissaoId)],
);

// Partial unique index (COALESCE trick) not supported in MySQL —
// uniqueness for (usuario_admin_id, grupo_id) when ambiente_id IS NULL
// is enforced in rbac.service.ts before INSERT.
export const usuariosAdminGrupos = mysqlTable("usuarios_admin_grupos", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  usuarioAdminId: char("usuario_admin_id", { length: 36 }).notNull(),
  grupoId: char("grupo_id", { length: 36 }).notNull(),
  ambienteId: char("ambiente_id", { length: 36 }),
  acessoGlobal: boolean("acesso_global").default(false),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  usuarioId: char("usuario_id", { length: 36 }).notNull(),
  tipoUsuario: mysqlEnum("tipo_usuario", ["admin", "aluno"]).notNull(),
  expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
  revokedAt: datetime("revoked_at", { mode: "date", fsp: 3 }),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  usuarioId: char("usuario_id", { length: 36 }).notNull(),
  tipoUsuario: mysqlEnum("tipo_usuario", ["admin", "aluno"]).notNull(),
  expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
  usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
  criadoEm: datetime("criado_em", { mode: "date", fsp: 3 }).notNull().default(new Date()),
});
