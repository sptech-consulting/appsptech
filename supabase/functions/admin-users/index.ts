// Operações administrativas que exigem service_role.
// Substitui as antigas server functions (inviteAdminUser, updateAdminUserGroups,
// setAdminUserStatus, sendAdminPasswordReset) após a migração para SPA.
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

async function assertCanManageUsers(userId: string): Promise<Response | null> {
  const { data: row } = await admin
    .from("usuarios_admin")
    .select(
      "id, status, usuarios_admin_grupos(grupo_id, acesso_global, grupos_acesso(grupo_permissoes(permissoes(chave))))",
    )
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (!row) return json({ error: "Sem acesso administrativo." }, 403);
  const links = (row as any).usuarios_admin_grupos ?? [];
  const permissoes = new Set<string>();
  for (const l of links) {
    const gp = l.grupos_acesso?.grupo_permissoes ?? [];
    for (const x of gp) if (x.permissoes?.chave) permissoes.add(x.permissoes.chave);
  }
  if (!permissoes.has("usuarios.criar") && !permissoes.has("usuarios.editar")) {
    return json({ error: "Sem permissão para gerenciar usuários administradores." }, 403);
  }
  return null;
}

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 180;
}
function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function invite(body: any): Promise<Response> {
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  if (nome.length < 2 || nome.length > 120) return json({ error: "Nome inválido" }, 400);
  if (!isEmail(body?.email)) return json({ error: "E-mail inválido" }, 400);
  const grupos = Array.isArray(body?.grupos) ? body.grupos : [];
  for (const g of grupos) {
    if (!isUuid(g?.grupo_id)) return json({ error: "grupo_id inválido" }, 400);
    if (g.ambiente_id != null && !isUuid(g.ambiente_id)) return json({ error: "ambiente_id inválido" }, 400);
  }
  const email = (body.email as string).toLowerCase().trim();

  const { data: existing } = await admin
    .from("usuarios_admin").select("id").ilike("email", email).maybeSingle();
  if (existing) return json({ error: "Já existe um administrador com esse e-mail." }, 400);

  let authUserId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
  if (found) {
    authUserId = found.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID() + "Aa1!",
      user_metadata: { nome },
    });
    if (createErr) return json({ error: createErr.message }, 400);
    authUserId = created.user?.id ?? null;
  }
  if (!authUserId) return json({ error: "Falha ao criar usuário de autenticação." }, 500);

  const { data: novo, error: insErr } = await admin
    .from("usuarios_admin")
    .insert({ nome, email, status: "ativo", auth_user_id: authUserId })
    .select("id").single();
  if (insErr) return json({ error: insErr.message }, 400);

  if (grupos.length > 0) {
    const rows = grupos.map((g: any) => ({
      usuario_admin_id: novo.id,
      grupo_id: g.grupo_id,
      acesso_global: !!g.acesso_global,
      ambiente_id: g.acesso_global ? null : g.ambiente_id ?? null,
    }));
    const { error: gErr } = await admin.from("usuarios_admin_grupos").insert(rows);
    if (gErr) return json({ error: gErr.message }, 400);
  }

  const { data: linkData } = await admin.auth.admin.generateLink({ type: "recovery", email });
  return json({
    id: novo.id,
    auth_user_id: authUserId,
    reset_link: linkData?.properties?.action_link ?? null,
  });
}

async function updateGroups(body: any): Promise<Response> {
  if (!isUuid(body?.usuario_admin_id)) return json({ error: "usuario_admin_id inválido" }, 400);
  const grupos = Array.isArray(body?.grupos) ? body.grupos : [];
  for (const g of grupos) {
    if (!isUuid(g?.grupo_id)) return json({ error: "grupo_id inválido" }, 400);
    if (g.ambiente_id != null && !isUuid(g.ambiente_id)) return json({ error: "ambiente_id inválido" }, 400);
  }
  await admin.from("usuarios_admin_grupos").delete().eq("usuario_admin_id", body.usuario_admin_id);
  if (grupos.length > 0) {
    const rows = grupos.map((g: any) => ({
      usuario_admin_id: body.usuario_admin_id,
      grupo_id: g.grupo_id,
      acesso_global: !!g.acesso_global,
      ambiente_id: g.acesso_global ? null : g.ambiente_id ?? null,
    }));
    const { error } = await admin.from("usuarios_admin_grupos").insert(rows);
    if (error) return json({ error: error.message }, 400);
  }
  return json({ ok: true });
}

async function setStatus(body: any): Promise<Response> {
  if (!isUuid(body?.usuario_admin_id)) return json({ error: "usuario_admin_id inválido" }, 400);
  if (body?.status !== "ativo" && body?.status !== "inativo") return json({ error: "status inválido" }, 400);
  const { error } = await admin
    .from("usuarios_admin").update({ status: body.status }).eq("id", body.usuario_admin_id);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
}

async function sendReset(body: any): Promise<Response> {
  if (!isEmail(body?.email)) return json({ error: "E-mail inválido" }, 400);
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: (body.email as string).toLowerCase().trim(),
  });
  if (error) return json({ error: error.message }, 400);
  return json({ reset_link: linkData?.properties?.action_link ?? null });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authed = await authenticate(req);
  if (authed instanceof Response) return authed;

  const denied = await assertCanManageUsers(authed.userId);
  if (denied) return denied;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const action = body?.action;

  switch (action) {
    case "invite": return invite(body);
    case "updateGroups": return updateGroups(body);
    case "setStatus": return setStatus(body);
    case "sendReset": return sendReset(body);
    default: return json({ error: "Unknown action" }, 400);
  }
});
