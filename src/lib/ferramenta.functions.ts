import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isUuid } from "@/lib/slug";

export type FerramentaTagTipo = "input" | "output" | "integracao";

export type FerramentaDetalhe = {
  id: string;
  nome: string;
  descricao: string | null;
  subtitulo: string | null;
  descricao_longa: string | null;
  url: string | null;
  icone_url: string | null;
  imagem_capa_url: string | null;
  categoria: string | null;
  tipo_abertura: "nova_aba" | "mesma_aba" | "modal" | null;
  frase_destaque: string | null;
  casos_uso: { id: string; texto: string }[];
  tags: { id: string; tipo: FerramentaTagTipo; rotulo: string }[];
  blocos: { id: string; titulo: string; conteudo: string }[];
  funcionalidades: { id: string; titulo: string; descricao: string | null; imagem_url: string | null }[];
  casos_teste: { id: string; titulo: string; badge: string | null; prompt_exemplo: string | null; explicacao: string | null }[];
  ambiente_slug: string;
  ambiente_nome: string;
};

export const getFerramentaDetalhe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; ferramentaId: string }) => {
    if (!input?.slug || typeof input.slug !== "string" || input.slug.length > 120) {
      throw new Error("slug inválido");
    }
    if (!input?.ferramentaId || typeof input.ferramentaId !== "string") {
      throw new Error("id inválido");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<FerramentaDetalhe> => {
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

    const { data: vincAluno } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("id")
      .eq("ambiente_id", amb.id)
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo")
      .maybeSingle();
    if (!vincAluno) throw new Error("Acesso negado");

    // Resolve por UUID ou slug
    const ferrQuery = supabaseAdmin
      .from("ferramentas")
      .select(
        "id, nome, descricao, subtitulo, descricao_longa, url, icone_url, imagem_capa_url, categoria, tipo_abertura, frase_destaque, status, slug",
      );
    const { data: f } = isUuid(data.ferramentaId)
      ? await ferrQuery.eq("id", data.ferramentaId).maybeSingle()
      : await ferrQuery.eq("slug", data.ferramentaId).maybeSingle();
    if (!f || f.status !== "ativo") throw new Error("Ferramenta indisponível");

    const { data: vincFerr } = await supabaseAdmin
      .from("ambiente_ferramentas")
      .select("id, status")
      .eq("ambiente_id", amb.id)
      .eq("ferramenta_id", f.id)
      .eq("status", "ativo")
      .maybeSingle();
    if (!vincFerr) throw new Error("Ferramenta não disponível neste ambiente");

    const [casosUsoRes, tagsRes, blocosRes, funcsRes, casosTesteRes] = await Promise.all([
      supabaseAdmin.from("ferramenta_casos_uso").select("id, texto, ordem").eq("ferramenta_id", f.id).order("ordem"),
      supabaseAdmin.from("ferramenta_tags").select("id, tipo, rotulo, ordem").eq("ferramenta_id", f.id).order("ordem"),
      supabaseAdmin.from("ferramenta_blocos").select("id, titulo, conteudo, ordem").eq("ferramenta_id", f.id).order("ordem"),
      supabaseAdmin.from("ferramenta_funcionalidades").select("id, titulo, descricao, imagem_url, ordem").eq("ferramenta_id", f.id).order("ordem"),
      supabaseAdmin.from("ferramenta_casos_teste").select("id, titulo, badge, prompt_exemplo, explicacao, ordem").eq("ferramenta_id", f.id).order("ordem"),
    ]);

    return {
      id: f.id,
      nome: f.nome,
      descricao: f.descricao,
      subtitulo: f.subtitulo,
      descricao_longa: f.descricao_longa,
      url: f.url,
      icone_url: f.icone_url,
      imagem_capa_url: f.imagem_capa_url,
      categoria: f.categoria,
      tipo_abertura: f.tipo_abertura,
      frase_destaque: f.frase_destaque,
      casos_uso: (casosUsoRes.data ?? []).map((r) => ({ id: r.id, texto: r.texto })),
      tags: (tagsRes.data ?? []).map((r) => ({ id: r.id, tipo: r.tipo as FerramentaTagTipo, rotulo: r.rotulo })),
      blocos: (blocosRes.data ?? []).map((r) => ({ id: r.id, titulo: r.titulo, conteudo: r.conteudo })),
      funcionalidades: (funcsRes.data ?? []).map((r) => ({
        id: r.id,
        titulo: r.titulo,
        descricao: r.descricao,
        imagem_url: r.imagem_url,
      })),
      casos_teste: (casosTesteRes.data ?? []).map((r) => ({
        id: r.id,
        titulo: r.titulo,
        badge: r.badge,
        prompt_exemplo: r.prompt_exemplo,
        explicacao: r.explicacao,
      })),
      ambiente_slug: amb.slug,
      ambiente_nome: amb.nome,
    };
  });
