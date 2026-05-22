// Operações administrativas para alunos que exigem service_role.
// Atualmente expõe a ação `setTempPassword` para definir/redefinir a senha
// do aluno (criando o usuário em auth.users quando necessário) e vincular
// `alunos.auth_user_id`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function authenticate(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return json({ error: "Unauthorized" }, 401);
  return { userId: data.user.id };
}

async function assertActiveAdmin(userId: string): Promise<Response | null> {
  const { data } = await admin
    .from("usuarios_admin")
    .select("id")
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (!data) return json({ error: "Sem acesso administrativo." }, 403);
  return null;
}

function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function setTempPassword(body: any): Promise<Response> {
  if (!isUuid(body?.aluno_id)) return json({ error: "aluno_id inválido" }, 400);
  const senha = typeof body?.senha === "string" ? body.senha : "";
  if (senha.length < 8 || senha.length > 72) {
    return json({ error: "A senha deve ter entre 8 e 72 caracteres." }, 400);
  }

  const { data: aluno, error: alErr } = await admin
    .from("alunos")
    .select("id, nome_completo, email_acesso, auth_user_id")
    .eq("id", body.aluno_id)
    .maybeSingle();
  if (alErr) return json({ error: alErr.message }, 400);
  if (!aluno) return json({ error: "Aluno não encontrado." }, 404);

  const email = aluno.email_acesso.toLowerCase().trim();

  // Tenta achar usuário auth pelo e-mail
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

  let authUserId: string | null = null;
  if (found) {
    authUserId = found.id;
    const { error: updErr } = await admin.auth.admin.updateUserById(found.id, {
      password: senha,
      email_confirm: true,
    });
    if (updErr) return json({ error: updErr.message }, 400);
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: senha,
      user_metadata: { nome_completo: aluno.nome_completo },
    });
    if (createErr) return json({ error: createErr.message }, 400);
    authUserId = created.user?.id ?? null;
  }
  if (!authUserId) return json({ error: "Falha ao criar usuário de autenticação." }, 500);

  if (aluno.auth_user_id !== authUserId) {
    const { error: linkErr } = await admin
      .from("alunos")
      .update({ auth_user_id: authUserId })
      .eq("id", aluno.id);
    if (linkErr) return json({ error: linkErr.message }, 400);
  }

  return json({ ok: true, auth_user_id: authUserId });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authed = await authenticate(req);
  if (authed instanceof Response) return authed;

  const denied = await assertActiveAdmin(authed.userId);
  if (denied) return denied;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  switch (body?.action) {
    case "setTempPassword": return setTempPassword(body);
    default: return json({ error: "Unknown action" }, 400);
  }
});
