import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("usuarios_admin")
    .select("id")
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (!data) throw new Error("Acesso negado");
  return data.id as string;
}

/**
 * Envia/regenera convite por e-mail para um aluno definir sua senha.
 * - Se o aluno ainda não tem auth_user: usa inviteUserByEmail (cria + envia).
 * - Se já tem: gera link de recuperação (recovery).
 * Retorna o action_link para que o admin possa copiar caso o e-mail falhe.
 */
export const enviarConviteAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        aluno_id: z.string().uuid(),
        redirect_to: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const adminId = await assertAdmin(context.userId);

    const { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, auth_user_id")
      .eq("id", data.aluno_id)
      .maybeSingle();
    if (!aluno) throw new Error("Aluno não encontrado.");

    const email = aluno.email_acesso.toLowerCase().trim();
    const redirectTo = data.redirect_to;

    // Procurar usuário auth existente
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

    let actionLink: string | null = null;

    if (!found) {
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { nome_completo: aluno.nome_completo },
      });
      if (error) throw new Error(error.message);
      // inviteUserByEmail não retorna action_link diretamente; gera recovery como fallback
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      actionLink = linkData?.properties?.action_link ?? null;
      if (invited.user?.id && !aluno.auth_user_id) {
        await supabaseAdmin
          .from("alunos")
          .update({ auth_user_id: invited.user.id })
          .eq("id", aluno.id);
      }
    } else {
      const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) throw new Error(error.message);
      actionLink = linkData?.properties?.action_link ?? null;
      if (!aluno.auth_user_id) {
        await supabaseAdmin
          .from("alunos")
          .update({ auth_user_id: found.id })
          .eq("id", aluno.id);
      }
    }

    await supabaseAdmin.from("logs_auditoria").insert({
      usuario_admin_id: adminId,
      acao: "aluno.convite_enviado",
      entidade: "alunos",
      entidade_id: aluno.id,
      dados_novos: { email, redirect_to: redirectTo ?? null },
    });

    return { ok: true, action_link: actionLink };
  });
