import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isUuid } from "@/lib/slug";

export type NovidadeDetalhe = {
  id: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  imagem_url: string | null;
  fonte_url: string | null;
  fonte_nome: string | null;
  categoria: string | null;
  publicado_em: string | null;
  ambiente_slug: string;
  ambiente_nome: string;
};

export const getNovidadeDetalhe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; novidadeId: string }) => {
    if (!input?.slug || typeof input.slug !== "string" || input.slug.length > 120) {
      throw new Error("slug inválido");
    }
    if (!input?.novidadeId || typeof input.novidadeId !== "string") {
      throw new Error("id inválido");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<NovidadeDetalhe> => {
    const { userId } = context;

    const { data: amb } = await supabaseAdmin
      .from("ambientes")
      .select("id, nome, slug, status")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!amb || amb.status !== "ativo") throw new Error("Ambiente não encontrado");

    const { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, status")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!aluno || aluno.status !== "ativo") throw new Error("Acesso negado");

    const { data: vinc } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("id")
      .eq("ambiente_id", amb.id)
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo")
      .maybeSingle();
    if (!vinc) throw new Error("Acesso negado");

    const { data: n } = await supabaseAdmin
      .from("novidades")
      .select("id, titulo, resumo, conteudo, imagem_url, fonte_url, fonte_nome, categoria, publicado_em, status, ambiente_id")
      .eq("id", data.novidadeId)
      .maybeSingle();
    if (!n || n.ambiente_id !== amb.id || n.status !== "publicada") {
      throw new Error("Novidade não encontrada");
    }

    return {
      id: n.id,
      titulo: n.titulo,
      resumo: n.resumo,
      conteudo: n.conteudo,
      imagem_url: n.imagem_url,
      fonte_url: n.fonte_url,
      fonte_nome: n.fonte_nome,
      categoria: n.categoria,
      publicado_em: n.publicado_em,
      ambiente_slug: amb.slug,
      ambiente_nome: amb.nome,
    };
  });
