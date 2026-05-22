import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const ALUNO_IDS = [
  "566c3d94-cf6a-4394-a5a5-6c27b3ade999",
  "4377bc13-7cb1-4141-8699-78d93cded476",
];
const SENHA = "SpTech@2026";

Deno.serve(async () => {
  const results: any[] = [];
  for (const id of ALUNO_IDS) {
    try {
      const { data: aluno, error } = await admin
        .from("alunos")
        .select("id, email_acesso, nome_completo, auth_user_id")
        .eq("id", id)
        .single();
      if (error || !aluno) { results.push({ id, error: error?.message ?? "not found" }); continue; }

      const email = aluno.email_acesso.toLowerCase().trim();
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

      let authId: string;
      if (found) {
        authId = found.id;
        const { error: uErr } = await admin.auth.admin.updateUserById(found.id, {
          password: SENHA, email_confirm: true,
        });
        if (uErr) { results.push({ id, email, error: uErr.message }); continue; }
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email, password: SENHA, email_confirm: true,
          user_metadata: { nome_completo: aluno.nome_completo },
        });
        if (cErr || !created.user) { results.push({ id, email, error: cErr?.message }); continue; }
        authId = created.user.id;
      }

      if (aluno.auth_user_id !== authId) {
        await admin.from("alunos").update({ auth_user_id: authId }).eq("id", id);
      }
      results.push({ id, email, auth_user_id: authId, ok: true });
    } catch (e) {
      results.push({ id, error: String(e) });
    }
  }
  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
