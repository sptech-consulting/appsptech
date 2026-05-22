import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Após o login do aluno, vincula auth.uid() ao registro public.alunos
 * pelo email_acesso (case-insensitive), se ainda não estiver vinculado.
 * Retorna o aluno (ou null se não houver pré-cadastro).
 */
export const ensureAlunoAuthLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError) throw new Error(authError.message);
    const email = (authUser.user?.email ?? (context.claims.email as string | undefined) ?? "")
      .toLowerCase()
      .trim();
    if (!email) return null;

    // Já vinculado?
    const { data: existing } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (existing) return existing;

    // Procura por email
    const { data: byEmail } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .ilike("email_acesso", email)
      .limit(1)
      .maybeSingle();

    if (!byEmail) return null;
    if (byEmail.auth_user_id && byEmail.auth_user_id !== userId) {
      // pertence a outro auth user — não sobrescrever
      return null;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("alunos")
      .update({ auth_user_id: userId })
      .eq("id", byEmail.id)
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/**
 * Confere se o aluno autenticado tem acesso ativo ao ambiente (slug).
 */
export const checkAlunoAmbienteAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: amb } = await supabaseAdmin
      .from("ambientes")
      .select("id, status")
      .eq("slug", data.slug)
      .limit(1)
      .maybeSingle();
    if (!amb) return { ok: false as const, reason: "not_found" as const };
    if (amb.status !== "ativo") return { ok: false as const, reason: "inativo" as const };

    const { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, status")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!aluno || aluno.status !== "ativo") {
      return { ok: false as const, reason: "no_aluno" as const };
    }

    const { data: vinc } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("id, status")
      .eq("aluno_id", aluno.id)
      .eq("ambiente_id", amb.id)
      .limit(1)
      .maybeSingle();
    if (!vinc || vinc.status !== "ativo") {
      return { ok: false as const, reason: "no_link" as const };
    }
    return { ok: true as const };
  });

/**
 * Retorna o aluno autenticado + lista de ambientes ativos vinculados a ele.
 * Usa supabaseAdmin para não depender de RLS / timing do JWT no browser.
 */
export const listarAmbientesDoAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    // Garante o vínculo via email (idempotente)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = (authUser?.user?.email ?? (context.claims.email as string | undefined) ?? "")
      .toLowerCase()
      .trim();

    let { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!aluno && email) {
      const { data: byEmail } = await supabaseAdmin
        .from("alunos")
        .select("id, nome_completo, email_acesso, status, auth_user_id")
        .ilike("email_acesso", email)
        .limit(1)
        .maybeSingle();
      if (byEmail && (!byEmail.auth_user_id || byEmail.auth_user_id === userId)) {
        const { data: updated } = await supabaseAdmin
          .from("alunos")
          .update({ auth_user_id: userId })
          .eq("id", byEmail.id)
          .select("id, nome_completo, email_acesso, status, auth_user_id")
          .single();
        aluno = updated;
      }
    }

    if (!aluno) return { aluno: null, ambientes: [] as Array<{ id: string; nome: string; slug: string; cor_primaria: string | null; imagem_capa_url: string | null }> };

    const { data: vinculos, error: vinculosError } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("ambiente_id, status")
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo");
    if (vinculosError) throw new Error(vinculosError.message);

    const ambienteIds = [...new Set((vinculos ?? []).map((v) => v.ambiente_id))];
    const { data: ambienteRows, error: ambientesError } = ambienteIds.length
      ? await supabaseAdmin
          .from("ambientes")
          .select("id, nome, slug, cor_primaria, imagem_capa_url, status")
          .in("id", ambienteIds)
          .eq("status", "ativo")
      : { data: [] as any[], error: null };
    if (ambientesError) throw new Error(ambientesError.message);

    const byId = new Map((ambienteRows ?? []).map((a: any) => [a.id, a]));
    const ambientes = ambienteIds
      .map((id) => byId.get(id))
      .filter((a: any) => a && a.status === "ativo")
      .map((a: any) => ({
        id: a.id,
        nome: a.nome,
        slug: a.slug,
        cor_primaria: a.cor_primaria,
        imagem_capa_url: a.imagem_capa_url,
      }));

    return {
      aluno: { nome_completo: aluno.nome_completo, email_acesso: aluno.email_acesso },
      ambientes,
    };
  });
