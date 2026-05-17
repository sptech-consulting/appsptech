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
    const email = (context.claims.email as string | undefined)?.toLowerCase().trim();
    const userId = context.userId;
    if (!email) return null;

    // Já vinculado?
    const { data: existing } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (existing) return existing;

    // Procura por email
    const { data: byEmail } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status, auth_user_id")
      .ilike("email_acesso", email)
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
      .maybeSingle();
    if (!amb) return { ok: false as const, reason: "not_found" as const };
    if (amb.status !== "ativo") return { ok: false as const, reason: "inativo" as const };

    const { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, status")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!aluno || aluno.status !== "ativo") {
      return { ok: false as const, reason: "no_aluno" as const };
    }

    const { data: vinc } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("id, status")
      .eq("aluno_id", aluno.id)
      .eq("ambiente_id", amb.id)
      .maybeSingle();
    if (!vinc || vinc.status !== "ativo") {
      return { ok: false as const, reason: "no_link" as const };
    }
    return { ok: true as const };
  });
