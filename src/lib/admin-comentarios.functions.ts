import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminComentarioRow = {
  id: string;
  conteudo: string;
  status: string;
  criado_em: string;
  ambiente_id: string;
  ambiente_nome: string;
  aula_id: string;
  aula_titulo: string;
  ambiente_slug: string;
  autor_nome: string;
  autor_tipo: "aluno" | "admin";
  parent_id: string | null;
  curtidas: number;
};

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

export const listarComentariosAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { status?: string; ambienteId?: string; busca?: string }) => i)
  .handler(async ({ data, context }): Promise<AdminComentarioRow[]> => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("aula_comentarios")
      .select("id, conteudo, status, criado_em, ambiente_id, aula_id, aluno_id, usuario_admin_id, parent_id")
      .order("criado_em", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    if (data.ambienteId) q = q.eq("ambiente_id", data.ambienteId);
    if (data.busca) q = q.ilike("conteudo", `%${data.busca}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const aIds = Array.from(new Set(list.map((r) => r.aluno_id).filter(Boolean) as string[]));
    const adIds = Array.from(new Set(list.map((r) => r.usuario_admin_id).filter(Boolean) as string[]));
    const ambIds = Array.from(new Set(list.map((r) => r.ambiente_id)));
    const aulaIds = Array.from(new Set(list.map((r) => r.aula_id)));

    const [{ data: alunos }, { data: admins }, { data: ambs }, { data: aulas }, { data: curtidas }] = await Promise.all([
      aIds.length
        ? supabaseAdmin.from("alunos").select("id, nome_completo").in("id", aIds)
        : Promise.resolve({ data: [] as { id: string; nome_completo: string }[] }),
      adIds.length
        ? supabaseAdmin.from("usuarios_admin").select("id, nome").in("id", adIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      ambIds.length
        ? supabaseAdmin.from("ambientes").select("id, nome, slug").in("id", ambIds)
        : Promise.resolve({ data: [] as { id: string; nome: string; slug: string }[] }),
      aulaIds.length
        ? supabaseAdmin.from("aulas").select("id, titulo").in("id", aulaIds)
        : Promise.resolve({ data: [] as { id: string; titulo: string }[] }),
      list.length
        ? supabaseAdmin
            .from("aula_comentario_curtidas")
            .select("comentario_id")
            .in("comentario_id", list.map((r) => r.id))
        : Promise.resolve({ data: [] as { comentario_id: string }[] }),
    ]);

    const aMap = new Map((alunos ?? []).map((x) => [x.id, x.nome_completo]));
    const adMap = new Map((admins ?? []).map((x) => [x.id, x.nome]));
    const ambMap = new Map((ambs ?? []).map((x) => [x.id, x]));
    const aulaMap = new Map((aulas ?? []).map((x) => [x.id, x.titulo]));
    const curtMap = new Map<string, number>();
    (curtidas ?? []).forEach((c) => curtMap.set(c.comentario_id, (curtMap.get(c.comentario_id) ?? 0) + 1));

    return list.map((r) => {
      const amb = ambMap.get(r.ambiente_id);
      return {
        id: r.id,
        conteudo: r.conteudo,
        status: r.status,
        criado_em: r.criado_em,
        ambiente_id: r.ambiente_id,
        ambiente_nome: amb?.nome ?? "—",
        ambiente_slug: amb?.slug ?? "",
        aula_id: r.aula_id,
        aula_titulo: aulaMap.get(r.aula_id) ?? "—",
        autor_nome: r.aluno_id
          ? (aMap.get(r.aluno_id) ?? "Aluno")
          : (adMap.get(r.usuario_admin_id as string) ?? "Equipe"),
        autor_tipo: r.aluno_id ? "aluno" : "admin",
        parent_id: r.parent_id,
        curtidas: curtMap.get(r.id) ?? 0,
      };
    });
  });

export const moderarComentario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { comentarioId: string; status: "ativo" | "oculto" | "removido" }) => {
    if (!["ativo", "oculto", "removido"].includes(i.status)) throw new Error("status inválido");
    return i;
  })
  .handler(async ({ data, context }) => {
    const adminId = await assertAdmin(context.userId);
    const { data: c } = await supabaseAdmin
      .from("aula_comentarios")
      .select("id, ambiente_id, status")
      .eq("id", data.comentarioId)
      .maybeSingle();
    if (!c) throw new Error("Comentário não encontrado");
    const { error } = await supabaseAdmin
      .from("aula_comentarios")
      .update({ status: data.status })
      .eq("id", data.comentarioId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("logs_auditoria").insert({
      ambiente_id: c.ambiente_id,
      usuario_admin_id: adminId,
      acao: `comentario.moderado.${data.status}`,
      entidade: "aula_comentarios",
      entidade_id: data.comentarioId,
      dados_anteriores: { status: c.status },
      dados_novos: { status: data.status },
    });
    return { ok: true };
  });

export type AdminLogRow = {
  id: string;
  acao: string;
  entidade: string | null;
  entidade_id: string | null;
  ambiente_id: string | null;
  ambiente_nome: string | null;
  usuario_admin_id: string | null;
  usuario_admin_nome: string | null;
  dados_novos: unknown;
  dados_anteriores: unknown;
  criado_em: string;
};

export const listarLogsAuditoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { acao?: string; ambienteId?: string; limit?: number }) => i)
  .handler(async ({ data, context }): Promise<AdminLogRow[]> => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("logs_auditoria")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.acao) q = q.ilike("acao", `%${data.acao}%`);
    if (data.ambienteId) q = q.eq("ambiente_id", data.ambienteId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ambIds = Array.from(new Set((rows ?? []).map((r) => r.ambiente_id).filter(Boolean) as string[]));
    const adIds = Array.from(new Set((rows ?? []).map((r) => r.usuario_admin_id).filter(Boolean) as string[]));
    const [{ data: ambs }, { data: ads }] = await Promise.all([
      ambIds.length
        ? supabaseAdmin.from("ambientes").select("id, nome").in("id", ambIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      adIds.length
        ? supabaseAdmin.from("usuarios_admin").select("id, nome").in("id", adIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    ]);
    const ambMap = new Map((ambs ?? []).map((a) => [a.id, a.nome]));
    const adMap = new Map((ads ?? []).map((a) => [a.id, a.nome]));
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      acao: r.acao,
      entidade: r.entidade,
      entidade_id: r.entidade_id,
      ambiente_id: r.ambiente_id,
      ambiente_nome: r.ambiente_id ? ambMap.get(r.ambiente_id) ?? null : null,
      usuario_admin_id: r.usuario_admin_id,
      usuario_admin_nome: r.usuario_admin_id ? adMap.get(r.usuario_admin_id) ?? null : null,
      dados_novos: r.dados_novos,
      dados_anteriores: r.dados_anteriores,
      criado_em: r.criado_em,
    }));
  });

export type AdminMetricas = {
  totais: {
    ambientes_ativos: number;
    alunos_ativos: number;
    cursos_publicados: number;
    aulas_publicadas: number;
    comentarios_30d: number;
    aulas_concluidas_30d: number;
  };
  aulas_mais_assistidas: { id: string; titulo: string; visualizacoes: number }[];
  comentarios_por_dia: { data: string; total: number }[];
  ambientes_mais_engajados: { id: string; nome: string; comentarios: number; conclusoes: number }[];
};

export const getAdminMetricas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => ({}))
  .handler(async ({ context }): Promise<AdminMetricas> => {
    await assertAdmin(context.userId);
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [
      { count: ambAt },
      { count: aluAt },
      { count: cursPub },
      { count: aulPub },
      { count: com30 },
      { count: conc30 },
      { data: aulasViewsRows },
      { data: comDias },
      { data: comAmb },
      { data: concAmb },
      { data: ambNomes },
    ] = await Promise.all([
      supabaseAdmin.from("ambientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabaseAdmin.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabaseAdmin.from("cursos").select("id", { count: "exact", head: true }).eq("status", "publicada"),
      supabaseAdmin.from("aulas").select("id", { count: "exact", head: true }).eq("status", "publicada"),
      supabaseAdmin
        .from("aula_comentarios")
        .select("id", { count: "exact", head: true })
        .gte("criado_em", since30)
        .eq("status", "ativo"),
      supabaseAdmin
        .from("aluno_aula_progresso")
        .select("id", { count: "exact", head: true })
        .eq("concluida", true)
        .gte("concluida_em", since30),
      supabaseAdmin
        .from("aluno_aula_progresso")
        .select("aula_id"),
      supabaseAdmin
        .from("aula_comentarios")
        .select("criado_em")
        .gte("criado_em", since30)
        .eq("status", "ativo"),
      supabaseAdmin
        .from("aula_comentarios")
        .select("ambiente_id")
        .gte("criado_em", since30)
        .eq("status", "ativo"),
      supabaseAdmin
        .from("aluno_aula_progresso")
        .select("aula_id, concluida, concluida_em")
        .eq("concluida", true)
        .gte("concluida_em", since30),
      supabaseAdmin.from("ambientes").select("id, nome"),
    ]);

    // Aulas mais assistidas (por contagens de progresso)
    const viewsByAula = new Map<string, number>();
    (aulasViewsRows ?? []).forEach((r: any) => {
      viewsByAula.set(r.aula_id, (viewsByAula.get(r.aula_id) ?? 0) + 1);
    });
    const topAulaIds = Array.from(viewsByAula.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    const { data: topAulasMeta } = topAulaIds.length
      ? await supabaseAdmin.from("aulas").select("id, titulo").in("id", topAulaIds)
      : { data: [] as { id: string; titulo: string }[] };
    const titMap = new Map((topAulasMeta ?? []).map((a) => [a.id, a.titulo]));
    const aulas_mais_assistidas = topAulaIds.map((id) => ({
      id,
      titulo: titMap.get(id) ?? "—",
      visualizacoes: viewsByAula.get(id) ?? 0,
    }));

    // Comentários por dia (últimos 14)
    const byDay = new Map<string, number>();
    (comDias ?? []).forEach((r: any) => {
      const d = r.criado_em.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + 1);
    });
    const comentarios_por_dia: { data: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      comentarios_por_dia.push({ data: d, total: byDay.get(d) ?? 0 });
    }

    // Ambientes mais engajados
    const ambComMap = new Map<string, number>();
    (comAmb ?? []).forEach((r: any) => ambComMap.set(r.ambiente_id, (ambComMap.get(r.ambiente_id) ?? 0) + 1));
    // conclusões por ambiente: via aula -> modulo -> curso -> ambiente_cursos
    const concByAulaId = new Map<string, number>();
    (concAmb ?? []).forEach((r: any) => concByAulaId.set(r.aula_id, (concByAulaId.get(r.aula_id) ?? 0) + 1));
    const aulaIds = Array.from(concByAulaId.keys());
    const { data: ja } = aulaIds.length
      ? await supabaseAdmin.from("aulas").select("id, modulo_id").in("id", aulaIds)
      : { data: [] as { id: string; modulo_id: string | null }[] };
    const modIds = Array.from(new Set((ja ?? []).map((a) => a.modulo_id).filter(Boolean) as string[]));
    const { data: jm } = modIds.length
      ? await supabaseAdmin.from("modulos").select("id, curso_id").in("id", modIds)
      : { data: [] as { id: string; curso_id: string }[] };
    const cursoIds = Array.from(new Set((jm ?? []).map((m) => m.curso_id)));
    const { data: jac } = cursoIds.length
      ? await supabaseAdmin.from("ambiente_cursos").select("curso_id, ambiente_id").in("curso_id", cursoIds).eq("status", "ativo")
      : { data: [] as { curso_id: string; ambiente_id: string }[] };
    const aulaToAmb = new Map<string, string[]>();
    for (const a of ja ?? []) {
      const mod = (jm ?? []).find((m) => m.id === a.modulo_id);
      if (!mod) continue;
      const ambs = (jac ?? []).filter((x) => x.curso_id === mod.curso_id).map((x) => x.ambiente_id);
      aulaToAmb.set(a.id, ambs);
    }
    const ambConcMap = new Map<string, number>();
    concByAulaId.forEach((qtd, aulaId) => {
      (aulaToAmb.get(aulaId) ?? []).forEach((ambId) => {
        ambConcMap.set(ambId, (ambConcMap.get(ambId) ?? 0) + qtd);
      });
    });

    const ambNomeMap = new Map((ambNomes ?? []).map((a) => [a.id, a.nome]));
    const ambSet = new Set<string>([...ambComMap.keys(), ...ambConcMap.keys()]);
    const ambientes_mais_engajados = Array.from(ambSet)
      .map((id) => ({
        id,
        nome: ambNomeMap.get(id) ?? "—",
        comentarios: ambComMap.get(id) ?? 0,
        conclusoes: ambConcMap.get(id) ?? 0,
      }))
      .sort((a, b) => b.comentarios + b.conclusoes - (a.comentarios + a.conclusoes))
      .slice(0, 5);

    return {
      totais: {
        ambientes_ativos: ambAt ?? 0,
        alunos_ativos: aluAt ?? 0,
        cursos_publicados: cursPub ?? 0,
        aulas_publicadas: aulPub ?? 0,
        comentarios_30d: com30 ?? 0,
        aulas_concluidas_30d: conc30 ?? 0,
      },
      aulas_mais_assistidas,
      comentarios_por_dia,
      ambientes_mais_engajados,
    };
  });
