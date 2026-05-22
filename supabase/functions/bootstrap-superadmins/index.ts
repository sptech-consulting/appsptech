// One-shot: cria super admins com senha temporária. Remover após uso.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SUPER_ADMIN_GRUPO_ID = "c716050a-db7f-48c2-a4fa-fa0e935f1620";
const SENHA = "12345678";
const EMAILS = [
  "manoel.almeida@sptech.school",
  "fabio.figueredo@sptech.school",
  "pedro.rsilva@sptech.school",
  "murilo.barbosa@sptech.school",
  "giuliana.franca@sptech.school",
  "fernando.araujo@sptech.school",
  "joao.paula@sptech.school",
];

function nomeFromEmail(e: string): string {
  const local = e.split("@")[0];
  return local.split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

Deno.serve(async () => {
  const results: any[] = [];
  // listar usuários auth uma vez (paginar se preciso)
  const allAuth: any[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    allAuth.push(...users);
    if (users.length < 200) break;
  }

  for (const email of EMAILS) {
    try {
      const nome = nomeFromEmail(email);
      let authUserId: string | null = null;
      const found = allAuth.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
      if (found) {
        authUserId = found.id;
        const { error } = await admin.auth.admin.updateUserById(found.id, { password: SENHA, email_confirm: true });
        if (error) throw error;
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email, password: SENHA, email_confirm: true, user_metadata: { nome },
        });
        if (error) throw error;
        authUserId = data.user?.id ?? null;
      }
      if (!authUserId) throw new Error("sem auth_user_id");

      // garantir registro em usuarios_admin
      const { data: existing } = await admin
        .from("usuarios_admin").select("id").ilike("email", email).maybeSingle();
      let usuarioAdminId: string;
      if (existing) {
        usuarioAdminId = existing.id;
        await admin.from("usuarios_admin")
          .update({ nome, status: "ativo", auth_user_id: authUserId })
          .eq("id", existing.id);
      } else {
        const { data: novo, error: insErr } = await admin
          .from("usuarios_admin")
          .insert({ nome, email, status: "ativo", auth_user_id: authUserId })
          .select("id").single();
        if (insErr) throw insErr;
        usuarioAdminId = novo.id;
      }

      // garantir vínculo Super Admin global
      const { data: vinc } = await admin
        .from("usuarios_admin_grupos")
        .select("id")
        .eq("usuario_admin_id", usuarioAdminId)
        .eq("grupo_id", SUPER_ADMIN_GRUPO_ID)
        .eq("acesso_global", true)
        .maybeSingle();
      if (!vinc) {
        const { error: vErr } = await admin.from("usuarios_admin_grupos").insert({
          usuario_admin_id: usuarioAdminId,
          grupo_id: SUPER_ADMIN_GRUPO_ID,
          acesso_global: true,
          ambiente_id: null,
        });
        if (vErr) throw vErr;
      }

      results.push({ email, ok: true, usuario_admin_id: usuarioAdminId });
    } catch (e: any) {
      results.push({ email, ok: false, error: e?.message ?? String(e) });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
