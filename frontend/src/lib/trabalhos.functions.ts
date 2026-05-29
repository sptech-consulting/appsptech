import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isUuid } from "@/lib/slug";

function normCodigo(c: string) {
  return (c || "").toUpperCase().replace(/\s+/g, "");
}

async function resolverTrabalhoId(refOrId: string): Promise<string> {
  if (isUuid(refOrId)) return refOrId;
  const { data } = await supabaseAdmin
    .from("trabalhos")
    .select("id")
    .eq("slug", refOrId)
    .maybeSingle();
  if (!data) throw new Error("Trabalho não encontrado.");
  return data.id;
}

export const resolverAmbientePorCodigo = createServerFn({ method: "POST" })
  .inputValidator((input: { codigo: string }) => {
    if (!input?.codigo || typeof input.codigo !== "string" || input.codigo.length > 64) {
      throw new Error("Código inválido");
    }
    return { codigo: normCodigo(input.codigo) };
  })
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin.rpc("resolver_ambiente_por_codigo", {
      _codigo: data.codigo,
    });
    if (error) throw new Error(error.message);
    const row = (rows ?? [])[0];
    if (!row) throw new Error("Código não encontrado.");
    return row as {
      ambiente_id: string;
      nome: string;
      slug: string;
      logo_url: string | null;
      cor_primaria: string | null;
      cor_secundaria: string | null;
      cor_fundo: string | null;
      cor_texto: string | null;
    };
  });

export const listarTrabalhosPublicos = createServerFn({ method: "POST" })
  .inputValidator((input: { codigo: string }) => {
    if (!input?.codigo) throw new Error("Código inválido");
    return { codigo: normCodigo(input.codigo) };
  })
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin.rpc("listar_trabalhos_publicos", {
      _codigo: data.codigo,
    });
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as Array<{
      id: string;
      titulo: string;
      resumo: string | null;
      autor_nome: string;
      turma: string | null;
      imagem_capa_url: string | null;
      tags: string[] | null;
      destaque: boolean;
      publicado_em: string | null;
    }>;
    if (list.length === 0) return [] as Array<typeof list[number] & { slug: string | null }>;
    const ids = list.map((t) => t.id);
    const { data: slugs } = await supabaseAdmin
      .from("trabalhos")
      .select("id, slug")
      .in("id", ids);
    const slugById = new Map((slugs ?? []).map((s) => [s.id, (s as { slug: string | null }).slug ?? null]));
    return list.map((t) => ({ ...t, slug: slugById.get(t.id) ?? null }));
  });

export type TrabalhoPublicoCompleto = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  resumo: string | null;
  conteudo: string | null;
  autor_nome: string;
  turma: string | null;
  imagem_capa_url: string | null;
  link_externo: string | null;
  tags: string[] | null;
  publicado_em: string | null;
  ambiente_nome: string;
  ambiente_slug: string;
  apresentacao_tipo: "video" | "pptx" | "imagem" | "documento" | "link" | null;
  apresentacao_url: string | null;
  apresentacao_titulo: string | null;
  apresentacao_descricao: string | null;
  apresentacao_imagem_url: string | null;
  aplicacao_expectativa: string | null;
  ordem: number;
  funcionalidades: Array<{
    id: string;
    ordem: number;
    titulo: string;
    descricao: string | null;
    imagem_url: string | null;
  }>;
  links: Array<{
    id: string;
    ordem: number;
    rotulo: string;
    url: string;
    icone_url: string | null;
  }>;
};

export const obterTrabalhoPublico = createServerFn({ method: "POST" })
  .inputValidator((input: { codigo: string; trabalhoId: string }) => {
    if (!input?.codigo || !input?.trabalhoId) throw new Error("Parâmetros inválidos");
    return { codigo: normCodigo(input.codigo), trabalhoId: input.trabalhoId };
  })
  .handler(async ({ data }): Promise<TrabalhoPublicoCompleto> => {
    const trabalhoId = await resolverTrabalhoId(data.trabalhoId);
    const [{ data: rows, error }, { data: funcs, error: e2 }, { data: links, error: e3 }] = await Promise.all([
      supabaseAdmin.rpc("obter_trabalho_publico", { _codigo: data.codigo, _trabalho_id: trabalhoId }),
      supabaseAdmin.rpc("listar_funcionalidades_publicas", { _codigo: data.codigo, _trabalho_id: trabalhoId }),
      supabaseAdmin.rpc("listar_links_publicos", { _codigo: data.codigo, _trabalho_id: trabalhoId }),
    ]);
    if (error) throw new Error(error.message);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);
    const row = (rows ?? [])[0];
    if (!row) throw new Error("Trabalho não encontrado.");
    return {
      ...(row as Omit<TrabalhoPublicoCompleto, "funcionalidades" | "links">),
      funcionalidades: (funcs ?? []) as TrabalhoPublicoCompleto["funcionalidades"],
      links: (links ?? []) as TrabalhoPublicoCompleto["links"],
    };
  });

export const registrarVisualizacaoTrabalho = createServerFn({ method: "POST" })
  .inputValidator((input: { codigo: string; trabalhoId: string }) => {
    if (!input?.codigo || !input?.trabalhoId) throw new Error("Parâmetros inválidos");
    return { codigo: normCodigo(input.codigo), trabalhoId: input.trabalhoId };
  })
  .handler(async ({ data }) => {
    const trabalhoId = await resolverTrabalhoId(data.trabalhoId);
    const { data: rows, error: e1 } = await supabaseAdmin.rpc("obter_trabalho_publico", {
      _codigo: data.codigo,
      _trabalho_id: trabalhoId,
    });
    if (e1) throw new Error(e1.message);
    if (!rows || rows.length === 0) return { ok: false };
    const { data: cur } = await supabaseAdmin
      .from("trabalhos")
      .select("visualizacoes")
      .eq("id", trabalhoId)
      .single();
    const atual = cur?.visualizacoes ?? 0;
    await supabaseAdmin
      .from("trabalhos")
      .update({ visualizacoes: atual + 1 })
      .eq("id", trabalhoId);
    return { ok: true };
  });
