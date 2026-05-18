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
  slug: string | null;
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
  slug: string | null;
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
  slug: string | null;
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

export type CursoItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  categoria: string | null;
  nivel: string | null;
  total_aulas: number;
  primeira_aula_id: string | null;
  ordem: number;
  destaque: boolean;
};

export type AmbienteHomeData = {
  branding: AmbienteHomeBranding;
  aluno: { id: string; nome_completo: string; email_acesso: string };
  ferramentas: FerramentaItem[];
  novidades: NovidadeItem[];
  aulas: AulaItem[];
  cursos: CursoItem[];
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
        .select("id, slug, nome, descricao, url, icone_url, categoria, tipo_abertura, status")
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
            slug: (f as { slug: string | null }).slug ?? null,
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

    // 4) Novidades publicadas do ambiente (recebidas via webhook n8n)
    const { data: novRows } = await supabaseAdmin
      .from("novidades")
      .select("id, slug, titulo, resumo, imagem_url, fonte_nome, fonte_url, categoria, publicado_em")
      .eq("ambiente_id", amb.id)
      .eq("status", "publicada")
      .order("publicado_em", { ascending: false, nullsFirst: false })
      .order("criado_em", { ascending: false });

    const novidades: NovidadeItem[] = (novRows ?? []).map((n) => ({
      id: n.id,
      slug: (n as { slug: string | null }).slug ?? null,
      titulo: n.titulo,
      resumo: n.resumo,
      imagem_url: n.imagem_url,
      fonte_nome: n.fonte_nome,
      fonte_url: n.fonte_url,
      categoria: n.categoria,
      publicado_em: n.publicado_em,
      destaque: false,
    }));

    // 5) Aulas via cursos vinculados ao ambiente → módulos → aulas
    const now = new Date().toISOString();
    const { data: cursoLinks } = await supabaseAdmin
      .from("ambiente_cursos")
      .select("curso_id, ordem, liberado, data_liberacao, status")
      .eq("ambiente_id", amb.id)
      .eq("status", "ativo")
      .eq("liberado", true);

    const cursoIds = (cursoLinks ?? [])
      .filter((l) => !l.data_liberacao || l.data_liberacao <= now)
      .map((l) => l.curso_id);

    let aulas: AulaItem[] = [];
    let cursos: CursoItem[] = [];
    if (cursoIds.length) {
      const cursoOrdem = new Map((cursoLinks ?? []).map((l) => [l.curso_id, l.ordem ?? 0]));
      const cursoDestaque = new Map((cursoLinks ?? []).map((l) => [l.curso_id, !!(l as { destaque?: boolean }).destaque]));

      const { data: cursosRows } = await supabaseAdmin
        .from("cursos")
        .select("id, titulo, descricao, capa_url, categoria, nivel, status")
        .in("id", cursoIds)
        .eq("status", "publicada");

      const { data: mods } = await supabaseAdmin
        .from("modulos")
        .select("id, titulo, ordem, curso_id, status")
        .in("curso_id", cursoIds)
        .eq("status", "ativo");

      const modById = new Map((mods ?? []).map((m) => [m.id, m]));
      const modIds = (mods ?? []).map((m) => m.id);

      if (modIds.length) {
        const { data: au } = await supabaseAdmin
          .from("aulas")
          .select("id, slug, titulo, descricao, modulo, modulo_id, ordem, video_url, material_url, thumbnail_url, duracao_minutos, tipo_conteudo, status")
          .in("modulo_id", modIds)
          .eq("status", "publicada");

        aulas = (au ?? [])
          .map((a) => {
            const m = a.modulo_id ? modById.get(a.modulo_id) : null;
            const cOrd = m ? (cursoOrdem.get(m.curso_id) ?? 0) : 0;
            const mOrd = m?.ordem ?? 0;
            return {
              id: a.id,
              slug: (a as { slug: string | null }).slug ?? null,
              titulo: a.titulo,
              descricao: a.descricao,
              modulo: a.modulo ?? m?.titulo ?? null,
              video_url: a.video_url,
              material_url: a.material_url,
              thumbnail_url: a.thumbnail_url,
              duracao_minutos: a.duracao_minutos,
              tipo_conteudo: a.tipo_conteudo,
              modulo_ordem: cOrd * 1000 + mOrd,
              ordem: a.ordem ?? 0,
              _curso_id: m?.curso_id ?? null,
            } as AulaItem & { _curso_id: string | null };
          })
          .sort((a, b) => a.modulo_ordem - b.modulo_ordem || a.ordem - b.ordem);

        // Calcula total de aulas e primeira aula por curso
        const aulasOrdenadasPorCurso = new Map<string, { id: string; ordem: number; modulo_ordem: number }[]>();
        for (const a of aulas as (AulaItem & { _curso_id?: string | null })[]) {
          const cid = a._curso_id;
          if (!cid) continue;
          const list = aulasOrdenadasPorCurso.get(cid) ?? [];
          list.push({ id: a.id, ordem: a.ordem, modulo_ordem: a.modulo_ordem });
          aulasOrdenadasPorCurso.set(cid, list);
        }

        cursos = (cursosRows ?? [])
          .map((c) => {
            const list = aulasOrdenadasPorCurso.get(c.id) ?? [];
            return {
              id: c.id,
              titulo: c.titulo,
              descricao: c.descricao,
              capa_url: c.capa_url,
              categoria: c.categoria,
              nivel: c.nivel,
              total_aulas: list.length,
              primeira_aula_id: list[0]?.id ?? null,
              ordem: cursoOrdem.get(c.id) ?? 0,
              destaque: cursoDestaque.get(c.id) ?? false,
            };
          })
          .sort((a, b) => a.ordem - b.ordem);

        // Limpa campo auxiliar
        aulas = aulas.map((a) => {
          const { _curso_id, ...rest } = a as AulaItem & { _curso_id?: string | null };
          return rest;
        });
      } else {
        cursos = (cursosRows ?? []).map((c) => ({
          id: c.id,
          titulo: c.titulo,
          descricao: c.descricao,
          capa_url: c.capa_url,
          categoria: c.categoria,
          nivel: c.nivel,
          total_aulas: 0,
          primeira_aula_id: null,
          ordem: cursoOrdem.get(c.id) ?? 0,
          destaque: cursoDestaque.get(c.id) ?? false,
        })).sort((a, b) => a.ordem - b.ordem);
      }
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
      cursos,
    };
  });
