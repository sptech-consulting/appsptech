import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AmbienteHomeBranding = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  imagem_capa_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  cor_texto: string;
  cor_botao: string;
  cor_card: string;
  cor_borda: string;
  card_estilo: "flat" | "sombra" | "borda" | "imagem";
  card_borda: "quadrado" | "levemente_arredondado" | "arredondado" | "pill";
  card_tamanho: "compacto" | "medio" | "grande";
  card_sombra: boolean;
  card_exibir_icone: boolean;
  card_exibir_imagem: boolean;
  efeito_card_tilt_3d: boolean;
  efeito_card_glow: boolean;
  efeito_card_scale: boolean;
  efeito_botao_lift: boolean;
  efeito_entrada_animada: boolean;
  efeito_som_hover: boolean;
  efeito_som_volume: number;
  efeito_blobs_fundo: boolean;
  tema: "claro" | "escuro";
};

export type FerramentaItem = {
  id: string;
  nome: string;
  descricao: string | null;
  url: string | null;
  icone_url: string | null;
  categoria: string | null;
  tipo_abertura: "nova_aba" | "mesma_aba" | "modal" | null;
  destaque: boolean;
};

export type NovidadeItem = {
  id: string;
  titulo: string;
  resumo: string | null;
  imagem_url: string | null;
  fonte_nome: string | null;
  fonte_url: string | null;
  categoria: string | null;
  publicado_em: string | null;
  destaque: boolean;
};

export type AulaItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  modulo: string | null;
  video_url: string | null;
  material_url: string | null;
  thumbnail_url: string | null;
  duracao_minutos: number | null;
  tipo_conteudo: string | null;
  modulo_ordem: number;
  ordem: number;
};

export type AmbienteHomeData = {
  branding: AmbienteHomeBranding;
  aluno: { id: string; nome_completo: string; email_acesso: string };
  ferramentas: FerramentaItem[];
  novidades: NovidadeItem[];
  aulas: AulaItem[];
};

export const getAmbienteHome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => {
    if (!input?.slug || typeof input.slug !== "string" || input.slug.length > 120) {
      throw new Error("slug inválido");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<AmbienteHomeData> => {
    const { userId } = context;

    // 1) Ambiente
    const { data: amb, error: errAmb } = await supabaseAdmin
      .from("ambientes")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "ativo")
      .maybeSingle();
    if (errAmb) throw new Error(errAmb.message);
    if (!amb) throw new Error("Ambiente não encontrado ou inativo");

    // 2) Aluno + verificação de vínculo
    const { data: aluno, error: errAluno } = await supabaseAdmin
      .from("alunos")
      .select("id, nome_completo, email_acesso, status")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (errAluno) throw new Error(errAluno.message);
    if (!aluno || aluno.status !== "ativo") {
      throw new Error("Aluno não cadastrado ou inativo");
    }

    const { data: vinc } = await supabaseAdmin
      .from("ambiente_alunos")
      .select("id")
      .eq("ambiente_id", amb.id)
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo")
      .limit(1)
      .maybeSingle();
    if (!vinc) throw new Error("Aluno sem acesso a este ambiente");

    // 3) Ferramentas vinculadas ativas
    const { data: ferrLinks } = await supabaseAdmin
      .from("ambiente_ferramentas")
      .select("ferramenta_id, ordem, destaque, status")
      .eq("ambiente_id", amb.id)
      .eq("status", "ativo");

    const ferrIds = (ferrLinks ?? []).map((l) => l.ferramenta_id);
    let ferramentas: FerramentaItem[] = [];
    if (ferrIds.length) {
      const { data: ferr } = await supabaseAdmin
        .from("ferramentas")
        .select("id, nome, descricao, url, icone_url, categoria, tipo_abertura, status")
        .in("id", ferrIds)
        .eq("status", "ativo");
      const byId = new Map((ferr ?? []).map((f) => [f.id, f]));
      ferramentas = (ferrLinks ?? [])
        .filter((l) => byId.has(l.ferramenta_id))
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((l) => {
          const f = byId.get(l.ferramenta_id)!;
          return {
            id: f.id,
            nome: f.nome,
            descricao: f.descricao,
            url: f.url,
            icone_url: f.icone_url,
            categoria: f.categoria,
            tipo_abertura: f.tipo_abertura,
            destaque: !!l.destaque,
          };
        });
    }

    // 4) Novidades publicadas e vinculadas
    const { data: novLinks } = await supabaseAdmin
      .from("ambiente_novidades")
      .select("novidade_id, ordem, destaque, status")
      .eq("ambiente_id", amb.id)
      .eq("status", "ativo");

    const novIds = (novLinks ?? []).map((l) => l.novidade_id);
    let novidades: NovidadeItem[] = [];
    if (novIds.length) {
      const { data: nov } = await supabaseAdmin
        .from("novidades")
        .select("id, titulo, resumo, imagem_url, fonte_nome, fonte_url, categoria, publicado_em, status")
        .in("id", novIds)
        .eq("status", "publicada");
      const byId = new Map((nov ?? []).map((n) => [n.id, n]));
      novidades = (novLinks ?? [])
        .filter((l) => byId.has(l.novidade_id))
        .sort((a, b) => {
          const na = byId.get(a.novidade_id)!;
          const nb = byId.get(b.novidade_id)!;
          const da = na.publicado_em ? new Date(na.publicado_em).getTime() : 0;
          const db = nb.publicado_em ? new Date(nb.publicado_em).getTime() : 0;
          return db - da;
        })
        .map((l) => {
          const n = byId.get(l.novidade_id)!;
          return {
            id: n.id,
            titulo: n.titulo,
            resumo: n.resumo,
            imagem_url: n.imagem_url,
            fonte_nome: n.fonte_nome,
            fonte_url: n.fonte_url,
            categoria: n.categoria,
            publicado_em: n.publicado_em,
            destaque: !!l.destaque,
          };
        });
    }

    // 5) Aulas publicadas, liberadas e dentro da data
    const now = new Date().toISOString();
    const { data: aulaLinks } = await supabaseAdmin
      .from("ambiente_aulas")
      .select("aula_id, ordem, modulo_ordem, liberado, data_liberacao, status")
      .eq("ambiente_id", amb.id)
      .eq("status", "ativo")
      .eq("liberado", true);

    const aulaIds = (aulaLinks ?? [])
      .filter((l) => !l.data_liberacao || l.data_liberacao <= now)
      .map((l) => l.aula_id);

    let aulas: AulaItem[] = [];
    if (aulaIds.length) {
      const { data: au } = await supabaseAdmin
        .from("aulas")
        .select("id, titulo, descricao, modulo, video_url, material_url, thumbnail_url, duracao_minutos, tipo_conteudo, status")
        .in("id", aulaIds)
        .eq("status", "publicada");
      const byId = new Map((au ?? []).map((a) => [a.id, a]));
      aulas = (aulaLinks ?? [])
        .filter((l) => byId.has(l.aula_id))
        .sort((a, b) => (a.modulo_ordem ?? 0) - (b.modulo_ordem ?? 0) || (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((l) => {
          const a = byId.get(l.aula_id)!;
          return {
            id: a.id,
            titulo: a.titulo,
            descricao: a.descricao,
            modulo: a.modulo,
            video_url: a.video_url,
            material_url: a.material_url,
            thumbnail_url: a.thumbnail_url,
            duracao_minutos: a.duracao_minutos,
            tipo_conteudo: a.tipo_conteudo,
            modulo_ordem: l.modulo_ordem ?? 0,
            ordem: l.ordem ?? 0,
          };
        });
    }

    const branding: AmbienteHomeBranding = {
      id: amb.id,
      nome: amb.nome,
      slug: amb.slug,
      descricao: amb.descricao,
      logo_url: amb.logo_url,
      imagem_capa_url: amb.imagem_capa_url,
      cor_primaria: amb.cor_primaria ?? "#ED145B",
      cor_secundaria: amb.cor_secundaria ?? "#1F2A44",
      cor_fundo: amb.cor_fundo ?? "#FFFFFF",
      cor_texto: amb.cor_texto ?? "#1F2A44",
      cor_botao: amb.cor_botao ?? "#ED145B",
      cor_card: amb.cor_card ?? "#FFFFFF",
      cor_borda: amb.cor_borda ?? "#D0D3D4",
      card_estilo: amb.card_estilo ?? "sombra",
      card_borda: amb.card_borda ?? "arredondado",
      card_tamanho: amb.card_tamanho ?? "medio",
      card_sombra: amb.card_sombra ?? true,
      card_exibir_icone: amb.card_exibir_icone ?? true,
      card_exibir_imagem: amb.card_exibir_imagem ?? true,
      efeito_card_tilt_3d: !!amb.efeito_card_tilt_3d,
      efeito_card_glow: !!amb.efeito_card_glow,
      efeito_card_scale: !!amb.efeito_card_scale,
      efeito_botao_lift: !!amb.efeito_botao_lift,
      efeito_entrada_animada: !!amb.efeito_entrada_animada,
      efeito_som_hover: !!amb.efeito_som_hover,
      efeito_som_volume: amb.efeito_som_volume ?? 40,
      efeito_blobs_fundo: !!amb.efeito_blobs_fundo,
      tema: (amb.tema ?? "claro") as "claro" | "escuro",
    };

    return {
      branding,
      aluno: { id: aluno.id, nome_completo: aluno.nome_completo, email_acesso: aluno.email_acesso },
      ferramentas,
      novidades,
      aulas,
    };
  });
