/**
 * Seeds structural data that must exist for the app to function:
 * - All 45 permission keys
 * - Super Admin group with all permissions
 *
 * Uses DATABASE_URL directly — does not require the full app config.
 * Safe to run multiple times (uses onDuplicateKeyUpdate).
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { grupoPermissoes, gruposAcesso, permissoes } from "./schema/index.js";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const pool = mysql.createPool({ uri: DATABASE_URL, timezone: "+00:00", charset: "utf8mb4" });
const db = drizzle(pool, { mode: "default" });

const PERMISSOES = [
  // ambientes
  { chave: "ambientes.visualizar", modulo: "ambientes", descricao: "Visualizar ambientes" },
  { chave: "ambientes.criar", modulo: "ambientes", descricao: "Criar ambientes" },
  { chave: "ambientes.editar", modulo: "ambientes", descricao: "Editar ambientes" },
  { chave: "ambientes.inativar", modulo: "ambientes", descricao: "Inativar ambientes" },
  { chave: "ambientes.personalizar", modulo: "ambientes", descricao: "Personalizar ambientes" },
  { chave: "ambientes.arquivar", modulo: "ambientes", descricao: "Arquivar ambientes" },
  // ferramentas
  { chave: "ferramentas.visualizar", modulo: "ferramentas", descricao: "Visualizar ferramentas" },
  { chave: "ferramentas.criar", modulo: "ferramentas", descricao: "Criar ferramentas" },
  { chave: "ferramentas.editar", modulo: "ferramentas", descricao: "Editar ferramentas" },
  { chave: "ferramentas.inativar", modulo: "ferramentas", descricao: "Inativar ferramentas" },
  { chave: "ferramentas.vincular_ambiente", modulo: "ferramentas", descricao: "Vincular ferramentas a ambientes" },
  // novidades
  { chave: "novidades.visualizar", modulo: "novidades", descricao: "Visualizar novidades" },
  { chave: "novidades.criar", modulo: "novidades", descricao: "Criar novidades" },
  { chave: "novidades.editar", modulo: "novidades", descricao: "Editar novidades" },
  { chave: "novidades.publicar", modulo: "novidades", descricao: "Publicar novidades" },
  { chave: "novidades.arquivar", modulo: "novidades", descricao: "Arquivar novidades" },
  { chave: "novidades.vincular_ambiente", modulo: "novidades", descricao: "Vincular novidades a ambientes" },
  // aulas
  { chave: "aulas.visualizar", modulo: "aulas", descricao: "Visualizar aulas" },
  { chave: "aulas.criar", modulo: "aulas", descricao: "Criar aulas" },
  { chave: "aulas.editar", modulo: "aulas", descricao: "Editar aulas" },
  { chave: "aulas.publicar", modulo: "aulas", descricao: "Publicar aulas" },
  { chave: "aulas.arquivar", modulo: "aulas", descricao: "Arquivar aulas" },
  { chave: "aulas.vincular_ambiente", modulo: "aulas", descricao: "Vincular aulas a ambientes" },
  // alunos
  { chave: "alunos.visualizar", modulo: "alunos", descricao: "Visualizar alunos" },
  { chave: "alunos.criar", modulo: "alunos", descricao: "Criar alunos" },
  { chave: "alunos.editar", modulo: "alunos", descricao: "Editar alunos" },
  { chave: "alunos.importar", modulo: "alunos", descricao: "Importar alunos" },
  { chave: "alunos.inativar", modulo: "alunos", descricao: "Inativar alunos" },
  { chave: "alunos.vincular_ambiente", modulo: "alunos", descricao: "Vincular alunos a ambientes" },
  // usuarios
  { chave: "usuarios.visualizar", modulo: "usuarios", descricao: "Visualizar usuários admin" },
  { chave: "usuarios.criar", modulo: "usuarios", descricao: "Criar usuários admin" },
  { chave: "usuarios.editar", modulo: "usuarios", descricao: "Editar usuários admin" },
  { chave: "usuarios.bloquear", modulo: "usuarios", descricao: "Bloquear usuários admin" },
  { chave: "usuarios.vincular_grupo", modulo: "usuarios", descricao: "Vincular usuários a grupos" },
  // grupos
  { chave: "grupos.visualizar", modulo: "grupos", descricao: "Visualizar grupos" },
  { chave: "grupos.criar", modulo: "grupos", descricao: "Criar grupos" },
  { chave: "grupos.editar", modulo: "grupos", descricao: "Editar grupos" },
  { chave: "grupos.vincular_permissoes", modulo: "grupos", descricao: "Vincular permissões a grupos" },
  // permissoes
  { chave: "permissoes.visualizar", modulo: "permissoes", descricao: "Visualizar permissões" },
  { chave: "permissoes.gerenciar", modulo: "permissoes", descricao: "Gerenciar permissões" },
  // cursos
  { chave: "cursos.visualizar", modulo: "cursos", descricao: "Visualizar cursos" },
  { chave: "cursos.criar", modulo: "cursos", descricao: "Criar cursos" },
  { chave: "cursos.editar", modulo: "cursos", descricao: "Editar cursos" },
  { chave: "cursos.arquivar", modulo: "cursos", descricao: "Arquivar/excluir cursos" },
  { chave: "cursos.vincular_ambiente", modulo: "cursos", descricao: "Vincular cursos a ambientes" },
] as const;

async function seed(): Promise<void> {
  console.log("Seeding permissions...");
  for (const p of PERMISSOES) {
    await db
      .insert(permissoes)
      .values({ ...p })
      .onDuplicateKeyUpdate({ set: { descricao: p.descricao } });
  }

  console.log("Seeding Super Admin group...");
  await db
    .insert(gruposAcesso)
    .values({ nome: "Super Admin", descricao: "Acesso total ao sistema", escopo: "global" })
    .onDuplicateKeyUpdate({ set: { descricao: "Acesso total ao sistema" } });

  const [grupo] = await db
    .select()
    .from(gruposAcesso)
    .where(eq(gruposAcesso.nome, "Super Admin"));

  const todasPermissoes = await db.select().from(permissoes);

  console.log(`Linking ${todasPermissoes.length} permissions to Super Admin...`);
  for (const p of todasPermissoes) {
    if (!grupo) continue;
    await db
      .insert(grupoPermissoes)
      .values({ grupoId: grupo.id, permissaoId: p.id })
      .onDuplicateKeyUpdate({ set: { grupoId: grupo.id } });
  }

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
