import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertCanManageUsers(userId: string) {
  // Buscamos manualmente as permissões do admin (admin client bypassa RLS,
  // então não dá pra usar has_admin_permission que depende de auth.uid()).
  const { data: rows } = await supabaseAdmin
    .from("usuarios_admin")
    .select(
      "id, status, usuarios_admin_grupos(grupo_id, acesso_global, grupos_acesso(grupo_permissoes(permissoes(chave))))",
    )
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (!rows) throw new Error("Sem acesso administrativo.");
  const links = (rows as any).usuarios_admin_grupos ?? [];
  const permissoes = new Set<string>();
  for (const l of links) {
    const gp = l.grupos_acesso?.grupo_permissoes ?? [];
    for (const x of gp) if (x.permissoes?.chave) permissoes.add(x.permissoes.chave);
  }
  if (!permissoes.has("usuarios.criar") && !permissoes.has("usuarios.editar")) {
    throw new Error("Você não tem permissão para gerenciar usuários administradores.");
  }
  return { adminId: rows.id, permissoes };
}

/**
 * Cria/convida um usuário administrador.
 * Cria registro em auth.users (se não existir) e em usuarios_admin,
 * já vinculado por auth_user_id, e opcionalmente atribui grupos.
 */
export const inviteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        nome: z.string().min(2).max(120),
        email: z.string().email().max(180),
        grupos: z
          .array(
            z.object({
              grupo_id: z.string().uuid(),
              acesso_global: z.boolean().default(false),
              ambiente_id: z.string().uuid().nullable().optional(),
            }),
          )
          .default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageUsers(context.userId);

    const email = data.email.toLowerCase().trim();

    // 1) Existe em usuarios_admin?
    const { data: existing } = await supabaseAdmin
      .from("usuarios_admin")
      .select("id, auth_user_id")
      .ilike("email", email)
      .maybeSingle();
    if (existing) throw new Error("Já existe um administrador com esse e-mail.");

    // 2) Procura auth user por email
    let authUserId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found) {
      authUserId = found.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: crypto.randomUUID() + "Aa1!",
        user_metadata: { nome: data.nome },
      });
      if (createErr) throw new Error(createErr.message);
      authUserId = created.user?.id ?? null;
    }
    if (!authUserId) throw new Error("Falha ao criar usuário de autenticação.");

    // 3) Insere usuarios_admin
    const { data: novo, error: insErr } = await supabaseAdmin
      .from("usuarios_admin")
      .insert({ nome: data.nome, email, status: "ativo", auth_user_id: authUserId })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    // 4) Vincula grupos
    if (data.grupos.length > 0) {
      const rows = data.grupos.map((g) => ({
        usuario_admin_id: novo.id,
        grupo_id: g.grupo_id,
        acesso_global: g.acesso_global,
        ambiente_id: g.acesso_global ? null : g.ambiente_id ?? null,
      }));
      const { error: gErr } = await supabaseAdmin.from("usuarios_admin_grupos").insert(rows);
      if (gErr) throw new Error(gErr.message);
    }

    // 5) Gera link de reset para o admin definir senha
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    return {
      id: novo.id,
      auth_user_id: authUserId,
      reset_link: linkData?.properties?.action_link ?? null,
    };
  });

export const updateAdminUserGroups = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        usuario_admin_id: z.string().uuid(),
        grupos: z.array(
          z.object({
            grupo_id: z.string().uuid(),
            acesso_global: z.boolean().default(false),
            ambiente_id: z.string().uuid().nullable().optional(),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageUsers(context.userId);
    await supabaseAdmin
      .from("usuarios_admin_grupos")
      .delete()
      .eq("usuario_admin_id", data.usuario_admin_id);
    if (data.grupos.length > 0) {
      const rows = data.grupos.map((g) => ({
        usuario_admin_id: data.usuario_admin_id,
        grupo_id: g.grupo_id,
        acesso_global: g.acesso_global,
        ambiente_id: g.acesso_global ? null : g.ambiente_id ?? null,
      }));
      const { error } = await supabaseAdmin.from("usuarios_admin_grupos").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setAdminUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        usuario_admin_id: z.string().uuid(),
        status: z.enum(["ativo", "inativo"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageUsers(context.userId);
    const { error } = await supabaseAdmin
      .from("usuarios_admin")
      .update({ status: data.status })
      .eq("id", data.usuario_admin_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendAdminPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().email() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCanManageUsers(context.userId);
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email.toLowerCase().trim(),
    });
    if (error) throw new Error(error.message);
    return { reset_link: linkData?.properties?.action_link ?? null };
  });
