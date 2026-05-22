import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AlunoAreaAmbiente = {
  id: string;
  nome: string;
  slug: string;
  cor_primaria: string | null;
  imagem_capa_url: string | null;
};

export type AlunoAreaData = {
  aluno: { id: string; nome_completo: string; email_acesso: string } | null;
  ambientes: AlunoAreaAmbiente[];
};

export const getAlunoArea = createServerFn({ method: "POST" })
  .handler(async (): Promise<AlunoAreaData> => {
    return { aluno: null, ambientes: [] };
  });

// Re-define com middleware (mantém assinatura simples)
export const getAlunoAreaAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlunoAreaData> => {
    const { userId } = context;

    // Tenta achar o aluno pelo auth_user_id
    let { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    // Se não encontrou, tenta vincular pelo e-mail do auth user
    if (!aluno) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email?.toLowerCase();
      if (email) {
        const { data: porEmail } = await supabaseAdmin
          .from("alunos")
          .select("id, nome_completo, email_acesso, status, auth_user_id")
          .ilike("email_acesso", email)
          .maybeSingle();
        if (porEmail && !porEmail.auth_user_id) {
          await supabaseAdmin
            .from("alunos")
            .update({ auth_user_id: userId })
            .eq("id", porEmail.id);
          aluno = { ...porEmail, auth_user_id: userId };
        } else if (porEmail) {
          aluno = porEmail;
        }
      }
    }

    if (!aluno || aluno.status !== "ativo") {
      return { aluno: null, ambientes: [] };
    }

    // Lista ambientes vinculados ativos
    const { data: vincs } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("ambiente_id, status")
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo");

    const ambIds = (vincs ?? []).map((v) => v.ambiente_id);
    let ambientes: AlunoAreaAmbiente[] = [];
    if (ambIds.length) {
      const { data: ambs } = await supabaseAdmin
        .from("ambientes")
        .select("id, nome, slug, cor_primaria, imagem_capa_url, status")
        .in("id", ambIds)
        .eq("status", "ativo");
      ambientes = (ambs ?? []).map((a) => ({
        id: a.id,
        nome: a.nome,
        slug: a.slug,
        cor_primaria: a.cor_primaria,
        imagem_capa_url: a.imagem_capa_url,
      }));
    }

    return {
      aluno: { id: aluno.id, nome_completo: aluno.nome_completo, email_acesso: aluno.email_acesso },
      ambientes,
    };
  });
