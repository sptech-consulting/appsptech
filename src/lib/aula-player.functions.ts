import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AulaPlayerComentario = {
  id: string;
  parent_id: string | null;
  conteudo: string;
  criado_em: string;
  autor_nome: string;
  autor_tipo: "aluno" | "admin";
  autor_id: string;
  curtidas: number;
  liked_by_me: boolean;
  is_mine: boolean;
};

export type AulaPlayerModuloAula = {
  id: string;
  titulo: string;
  ordem: number;
  duracao_minutos: number | null;
  concluida: boolean;
};

export type AulaPlayerModulo = {
  id: string;
  titulo: string;
  ordem: number;
  aulas: AulaPlayerModuloAula[];
};

export type AulaPlayerRecomendado = {
  curso_id: string;
  titulo: string;
  capa_url: string | null;
  primeira_aula_id: string | null;
  total_aulas: number;
};

export type AulaPlayerData = {
  branding: {
    id: string;
    slug: string;
    nome: string;
    logo_url: string | null;
    cor_primaria: string;
    cor_secundaria: string;
    cor_fundo: string;
    cor_texto: string;
    cor_botao: string;
    cor_card: string;
    cor_borda: string;
    tema: "claro" | "escuro";
  };
  aluno: { id: string; nome_completo: string };
  curso: { id: string; titulo: string };
  modulo_atual: { id: string; titulo: string };
  aula: {
    id: string;
    titulo: string;
    descricao: string | null;
    video_url: string | null;
    material_url: string | null;
    duracao_minutos: number | null;
    tipo_conteudo: string | null;
    concluida: boolean;
  };
  modulos: AulaPlayerModulo[];
  recomendados: AulaPlayerRecomendado[];
  comentarios: AulaPlayerComentario[];
};

async function resolveAcesso(slug: string, aulaId: string, userId: string) {
  const { data: amb } = await supabaseAdmin
    .from("ambientes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();
  if (!amb) throw new Error("Ambiente não encontrado");

  const { data: aluno } = await supabaseAdmin
    .from("alunos")
    .select("id, nome_completo, status")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (!aluno || aluno.status !== "ativo") throw new Error("Aluno inativo");

  const { data: vinc } = await supabaseAdmin
    .from("ambiente_alunos")
    .select("id")
    .eq("ambiente_id", amb.id)
    .eq("aluno_id", aluno.id)
    .eq("status", "ativo")
    .maybeSingle();
  if (!vinc) throw new Error("Sem acesso a este ambiente");

  const { data: aula } = await supabaseAdmin
    .from("aulas")
    .select("*")
    .eq("id", aulaId)
    .maybeSingle();
  if (!aula || aula.status !== "publicada") throw new Error("Aula não encontrada");
  if (!aula.modulo_id) throw new Error("Aula sem módulo");

  const { data: modulo } = await supabaseAdmin
    .from("modulos")
    .select("id, titulo, ordem, curso_id")
    .eq("id", aula.modulo_id)
    .maybeSingle();
  if (!modulo) throw new Error("Módulo não encontrado");

  const { data: ac } = await supabaseAdmin
    .from("ambiente_cursos")
    .select("id")
    .eq("ambiente_id", amb.id)
    .eq("curso_id", modulo.curso_id)
    .eq("status", "ativo")
    .maybeSingle();
  if (!ac) throw new Error("Curso não disponível neste ambiente");

  return { amb, aluno, aula, modulo };
}

export const getAulaPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; aulaId: string }) => {
    if (!input?.slug || !input?.aulaId) throw new Error("parâmetros inválidos");
    return input;
  })
  .handler(async ({ data, context }): Promise<AulaPlayerData> => {
    const { userId } = context;
    const { amb, aluno, aula, modulo } = await resolveAcesso(data.slug, data.aulaId, userId);

    const { data: curso } = await supabaseAdmin
      .from("cursos")
      .select("id, titulo")
      .eq("id", modulo.curso_id)
      .maybeSingle();

    // Módulos do curso + aulas publicadas
    const { data: mods } = await supabaseAdmin
      .from("modulos")
      .select("id, titulo, ordem")
      .eq("curso_id", modulo.curso_id)
      .eq("status", "ativo")
      .order("ordem", { ascending: true });
    const modIds = (mods ?? []).map((m) => m.id);

    const { data: todasAulas } = modIds.length
      ? await supabaseAdmin
          .from("aulas")
          .select("id, titulo, ordem, duracao_minutos, modulo_id, status")
          .in("modulo_id", modIds)
          .eq("status", "publicada")
          .order("ordem", { ascending: true })
      : { data: [] as { id: string; titulo: string; ordem: number; duracao_minutos: number | null; modulo_id: string; status: string }[] };

    const allAulaIds = (todasAulas ?? []).map((a) => a.id);
    const { data: progresso } = allAulaIds.length
      ? await supabaseAdmin
          .from("aluno_aula_progresso")
          .select("aula_id, concluida")
          .eq("aluno_id", aluno.id)
          .in("aula_id", allAulaIds)
      : { data: [] as { aula_id: string; concluida: boolean }[] };
    const concluidasSet = new Set((progresso ?? []).filter((p) => p.concluida).map((p) => p.aula_id));

    const modulos: AulaPlayerModulo[] = (mods ?? []).map((m) => ({
      id: m.id,
      titulo: m.titulo,
      ordem: m.ordem,
      aulas: (todasAulas ?? [])
        .filter((a) => a.modulo_id === m.id)
        .map((a) => ({
          id: a.id,
          titulo: a.titulo,
          ordem: a.ordem,
          duracao_minutos: a.duracao_minutos,
          concluida: concluidasSet.has(a.id),
        })),
    }));

    // Cursos recomendados (outros cursos vinculados ao ambiente)
    const { data: outrosLinks } = await supabaseAdmin
      .from("ambiente_cursos")
      .select("curso_id, ordem, destaque")
      .eq("ambiente_id", amb.id)
      .eq("status", "ativo")
      .neq("curso_id", modulo.curso_id);
    const recIds = (outrosLinks ?? []).map((l) => l.curso_id);
    let recomendados: AulaPlayerRecomendado[] = [];
    if (recIds.length) {
      const { data: cs } = await supabaseAdmin
        .from("cursos")
        .select("id, titulo, capa_url, status")
        .in("id", recIds)
        .eq("status", "publicada");
      const { data: ms } = await supabaseAdmin
        .from("modulos")
        .select("id, curso_id, ordem")
        .in("curso_id", recIds)
        .eq("status", "ativo")
        .order("ordem", { ascending: true });
      const msIds = (ms ?? []).map((m) => m.id);
      const { data: as } = msIds.length
        ? await supabaseAdmin
            .from("aulas")
            .select("id, modulo_id, ordem, status")
            .in("modulo_id", msIds)
            .eq("status", "publicada")
            .order("ordem", { ascending: true })
        : { data: [] as { id: string; modulo_id: string; ordem: number; status: string }[] };
      recomendados = (cs ?? []).map((c) => {
        const cursoMods = (ms ?? []).filter((m) => m.curso_id === c.id);
        const cursoMIds = cursoMods.map((m) => m.id);
        const cursoAulas = (as ?? []).filter((a) => cursoMIds.includes(a.modulo_id));
        return {
          curso_id: c.id,
          titulo: c.titulo,
          capa_url: c.capa_url,
          primeira_aula_id: cursoAulas[0]?.id ?? null,
          total_aulas: cursoAulas.length,
        };
      });
    }

    // Comentários
    const { data: coments } = await supabaseAdmin
      .from("aula_comentarios")
      .select("id, parent_id, conteudo, criado_em, aluno_id, usuario_admin_id")
      .eq("aula_id", aula.id)
      .eq("status", "ativo")
      .order("criado_em", { ascending: true });

    const alunosIds = Array.from(new Set((coments ?? []).map((c) => c.aluno_id).filter(Boolean) as string[]));
    const adminsIds = Array.from(new Set((coments ?? []).map((c) => c.usuario_admin_id).filter(Boolean) as string[]));
    const { data: nomesAlunos } = alunosIds.length
      ? await supabaseAdmin.from("alunos").select("id, nome_completo").in("id", alunosIds)
      : { data: [] };
    const { data: nomesAdmins } = adminsIds.length
      ? await supabaseAdmin.from("usuarios_admin").select("id, nome").in("id", adminsIds)
      : { data: [] };
    const mapAluno = new Map((nomesAlunos ?? []).map((x: any) => [x.id, x.nome_completo]));
    const mapAdmin = new Map((nomesAdmins ?? []).map((x: any) => [x.id, x.nome]));

    const comIds = (coments ?? []).map((c) => c.id);
    const { data: curtidas } = comIds.length
      ? await supabaseAdmin
          .from("aula_comentario_curtidas")
          .select("comentario_id, aluno_id, usuario_admin_id")
          .in("comentario_id", comIds)
      : { data: [] as { comentario_id: string; aluno_id: string | null; usuario_admin_id: string | null }[] };
    const curtCount = new Map<string, number>();
    const likedByMe = new Set<string>();
    for (const k of curtidas ?? []) {
      curtCount.set(k.comentario_id, (curtCount.get(k.comentario_id) ?? 0) + 1);
      if (k.aluno_id === aluno.id) likedByMe.add(k.comentario_id);
    }

    const comentarios: AulaPlayerComentario[] = (coments ?? []).map((c) => {
      const isAluno = !!c.aluno_id;
      return {
        id: c.id,
        parent_id: c.parent_id,
        conteudo: c.conteudo,
        criado_em: c.criado_em,
        autor_nome: isAluno
          ? (mapAluno.get(c.aluno_id as string) ?? "Aluno")
          : (mapAdmin.get(c.usuario_admin_id as string) ?? "Equipe"),
        autor_tipo: isAluno ? "aluno" : "admin",
        autor_id: (c.aluno_id ?? c.usuario_admin_id) as string,
        curtidas: curtCount.get(c.id) ?? 0,
        liked_by_me: likedByMe.has(c.id),
        is_mine: c.aluno_id === aluno.id,
      };
    });

    return {
      branding: {
        id: amb.id,
        slug: amb.slug,
        nome: amb.nome,
        logo_url: amb.logo_url,
        cor_primaria: amb.cor_primaria ?? "#ED145B",
        cor_secundaria: amb.cor_secundaria ?? "#1F2A44",
        cor_fundo: amb.cor_fundo ?? "#FFFFFF",
        cor_texto: amb.cor_texto ?? "#1F2A44",
        cor_botao: amb.cor_botao ?? "#ED145B",
        cor_card: amb.cor_card ?? "#FFFFFF",
        cor_borda: amb.cor_borda ?? "#D0D3D4",
        tema: (amb.tema ?? "claro") as "claro" | "escuro",
      },
      aluno: { id: aluno.id, nome_completo: aluno.nome_completo },
      curso: { id: curso?.id ?? modulo.curso_id, titulo: curso?.titulo ?? "Curso" },
      modulo_atual: { id: modulo.id, titulo: modulo.titulo },
      aula: {
        id: aula.id,
        titulo: aula.titulo,
        descricao: aula.descricao,
        video_url: aula.video_url,
        material_url: aula.material_url,
        duracao_minutos: aula.duracao_minutos,
        tipo_conteudo: aula.tipo_conteudo,
        concluida: concluidasSet.has(aula.id),
      },
      modulos,
      recomendados,
    };
  });

export const marcarAulaConcluida = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { slug: string; aulaId: string; concluida: boolean }) => i)
  .handler(async ({ data, context }) => {
    const { aluno, aula, amb } = await resolveAcesso(data.slug, data.aulaId, context.userId);
    const { error } = await supabaseAdmin
      .from("aluno_aula_progresso")
      .upsert(
        {
          aluno_id: aluno.id,
          aula_id: aula.id,
          concluida: data.concluida,
          concluida_em: data.concluida ? new Date().toISOString() : null,
        },
        { onConflict: "aluno_id,aula_id" },
      );
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("logs_auditoria").insert({
      ambiente_id: amb.id,
      acao: data.concluida ? "aula.concluida" : "aula.reaberta",
      entidade: "aulas",
      entidade_id: aula.id,
      dados_novos: { aluno_id: aluno.id, concluida: data.concluida },
    });
    return { ok: true };
  });

export const postarComentario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { slug: string; aulaId: string; conteudo: string; parentId?: string | null }) => {
    if (!i.conteudo || i.conteudo.trim().length < 1 || i.conteudo.length > 4000) {
      throw new Error("Conteúdo inválido");
    }
    return i;
  })
  .handler(async ({ data, context }) => {
    const { amb, aluno, aula } = await resolveAcesso(data.slug, data.aulaId, context.userId);
    const { data: inserted, error } = await supabaseAdmin
      .from("aula_comentarios")
      .insert({
        aula_id: aula.id,
        ambiente_id: amb.id,
        aluno_id: aluno.id,
        parent_id: data.parentId ?? null,
        conteudo: data.conteudo.trim(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("logs_auditoria").insert({
      ambiente_id: amb.id,
      acao: "comentario.criado",
      entidade: "aula_comentarios",
      entidade_id: inserted.id,
      dados_novos: { aula_id: aula.id, aluno_id: aluno.id, parent_id: data.parentId ?? null },
    });
    return { id: inserted.id };
  });

export const removerComentario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { slug: string; aulaId: string; comentarioId: string }) => i)
  .handler(async ({ data, context }) => {
    const { amb, aluno } = await resolveAcesso(data.slug, data.aulaId, context.userId);
    const { data: c } = await supabaseAdmin
      .from("aula_comentarios")
      .select("id, aluno_id")
      .eq("id", data.comentarioId)
      .maybeSingle();
    if (!c || c.aluno_id !== aluno.id) throw new Error("Sem permissão");
    const { error } = await supabaseAdmin
      .from("aula_comentarios")
      .update({ status: "removido" })
      .eq("id", data.comentarioId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("logs_auditoria").insert({
      ambiente_id: amb.id,
      acao: "comentario.removido",
      entidade: "aula_comentarios",
      entidade_id: data.comentarioId,
    });
    return { ok: true };
  });

export const toggleCurtidaComentario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { slug: string; aulaId: string; comentarioId: string }) => i)
  .handler(async ({ data, context }) => {
    const { amb, aluno } = await resolveAcesso(data.slug, data.aulaId, context.userId);
    const { data: existing } = await supabaseAdmin
      .from("aula_comentario_curtidas")
      .select("id")
      .eq("comentario_id", data.comentarioId)
      .eq("aluno_id", aluno.id)
      .maybeSingle();
    if (existing) {
      await supabaseAdmin.from("aula_comentario_curtidas").delete().eq("id", existing.id);
      await supabaseAdmin.from("logs_auditoria").insert({
        ambiente_id: amb.id,
        acao: "comentario.descurtido",
        entidade: "aula_comentarios",
        entidade_id: data.comentarioId,
      });
      return { liked: false };
    }
    await supabaseAdmin
      .from("aula_comentario_curtidas")
      .insert({ comentario_id: data.comentarioId, aluno_id: aluno.id });
    await supabaseAdmin.from("logs_auditoria").insert({
      ambiente_id: amb.id,
      acao: "comentario.curtido",
      entidade: "aula_comentarios",
      entidade_id: data.comentarioId,
    });
    return { liked: true };
  });
