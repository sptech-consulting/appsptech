/**
 * Creates the default admin user if not already present.
 * Uses DATABASE_URL directly — does not require full app config.
 *
 * Usage: pnpm db:create-admin
 * Env:   DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASS
 */
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { gruposAcesso, usuariosAdmin, usuariosAdminGrupos } from "./schema/index.js";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const email = (process.env["ADMIN_EMAIL"] ?? "admin@sptech.com").toLowerCase().trim();
const name  = process.env["ADMIN_NAME"]  ?? "Admin";
const pass  = process.env["ADMIN_PASS"]  ?? "Admin@1234";

const pool = mysql.createPool({ uri: DATABASE_URL, timezone: "+00:00", charset: "utf8mb4" });
const db = drizzle(pool, { mode: "default" });

async function createAdmin(): Promise<void> {
  const [existing] = await db
    .select({ id: usuariosAdmin.id })
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.email, email))
    .limit(1);

  if (existing) {
    console.log(`Admin já existe: ${email}`);
    await pool.end();
    return;
  }

  const senhaHash = await hash(pass);

  await db.insert(usuariosAdmin).values({ nome: name, email, senhaHash, status: "ativo" });

  const [admin] = await db
    .select({ id: usuariosAdmin.id })
    .from(usuariosAdmin)
    .where(eq(usuariosAdmin.email, email))
    .limit(1);

  const [grupo] = await db
    .select({ id: gruposAcesso.id })
    .from(gruposAcesso)
    .where(eq(gruposAcesso.nome, "Super Admin"))
    .limit(1);

  if (admin && grupo) {
    await db
      .insert(usuariosAdminGrupos)
      .values({ usuarioAdminId: admin.id, grupoId: grupo.id, acessoGlobal: true })
      .onDuplicateKeyUpdate({ set: { acessoGlobal: true } });
  }

  console.log(`Admin criado: ${email}`);
  await pool.end();
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
