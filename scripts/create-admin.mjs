/**
 * Cria ou atualiza o usuário admin padrão no banco.
 * Usado pelo dev-start.sh — roda dentro do diretório backend.
 */
import { hash } from "@node-rs/argon2";
import mysql from "mysql2/promise";

const email = process.env["ADMIN_EMAIL"] ?? "admin@sptech.com";
const name  = process.env["ADMIN_NAME"]  ?? "Admin";
const pass  = process.env["ADMIN_PASS"]  ?? "Admin@1234";
const dbUrl = process.env["DATABASE_URL"];

if (!dbUrl) { console.error("DATABASE_URL não definida"); process.exit(1); }

const conn = await mysql.createConnection(dbUrl);

const [rows] = await conn.execute(
  "SELECT id FROM usuarios_admin WHERE email = ?", [email]
);

const senhaHash = await hash(pass);

if (rows.length === 0) {
  // Cria o admin
  const [result] = await conn.execute(
    "INSERT INTO usuarios_admin (id, nome, email, senha_hash, status) VALUES (UUID(), ?, ?, ?, 'ativo')",
    [name, email, senhaHash]
  );

  // Vincula ao grupo Super Admin com acesso_global = true
  await conn.execute(
    `INSERT IGNORE INTO usuarios_admin_grupos (id, usuario_admin_id, grupo_id, acesso_global)
     SELECT UUID(), ua.id, g.id, true
     FROM usuarios_admin ua, grupos_acesso g
     WHERE ua.email = ? AND g.nome = 'Super Admin'`,
    [email]
  );

  console.log(`Admin criado: ${email}`);
} else {
  console.log(`Admin já existe: ${email}`);
}

await conn.end();
