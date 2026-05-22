import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const EMAIL = "manoel.almeida@sptech.school";
const SENHA = "SpTech@2026";
const GRUPO = "c716050a-db7f-48c2-a4fa-fa0e935f1620";
Deno.serve(async () => {
  const all: any[] = [];
  for (let p = 1; p <= 20; p++) {
    const { data } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
    const u = data?.users ?? []; all.push(...u); if (u.length < 200) break;
  }
  const found = all.find((u) => (u.email ?? "").toLowerCase() === EMAIL);
  let authId = found?.id;
  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, { password: SENHA, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, password: SENHA, email_confirm: true, user_metadata: { nome: "Manoel Almeida" } });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    authId = data.user?.id;
  }
  const { data: ex } = await admin.from("usuarios_admin").select("id").ilike("email", EMAIL).maybeSingle();
  let uid: string;
  if (ex) {
    uid = ex.id;
    await admin.from("usuarios_admin").update({ nome: "Manoel Almeida", status: "ativo", auth_user_id: authId }).eq("id", ex.id);
  } else {
    const { data: novo, error } = await admin.from("usuarios_admin").insert({ nome: "Manoel Almeida", email: EMAIL, status: "ativo", auth_user_id: authId }).select("id").single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    uid = novo.id;
  }
  const { data: v } = await admin.from("usuarios_admin_grupos").select("id").eq("usuario_admin_id", uid).eq("grupo_id", GRUPO).eq("acesso_global", true).maybeSingle();
  if (!v) await admin.from("usuarios_admin_grupos").insert({ usuario_admin_id: uid, grupo_id: GRUPO, acesso_global: true, ambiente_id: null });
  return new Response(JSON.stringify({ ok: true, usuario_admin_id: uid }));
});
