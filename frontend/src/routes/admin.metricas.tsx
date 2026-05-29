import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMetricas, type AdminMetricas } from "@/lib/admin-comentarios.functions";
import { PageHeader } from "@/components/PageHeader";
import {
  Layers,
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/admin/metricas")({
  component: MetricasPage,
});

function MetricasPage() {
  const fnGet = useServerFn(getAdminMetricas);
  const [data, setData] = useState<AdminMetricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fnGet({ data: {} as any });
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar métricas");
      } finally {
        setLoading(false);
      }
    })();
  }, [fnGet]);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando métricas…</div>;
  if (error) return <div className="p-8 text-sm text-destructive">{error}</div>;
  if (!data) return null;

  const maxDia = Math.max(1, ...data.comentarios_por_dia.map((d) => d.total));
  const cards = [
    { label: "Ambientes ativos", value: data.totais.ambientes_ativos, icon: Layers },
    { label: "Alunos ativos", value: data.totais.alunos_ativos, icon: Users },
    { label: "Cursos publicados", value: data.totais.cursos_publicados, icon: BookOpen },
    { label: "Aulas publicadas", value: data.totais.aulas_publicadas, icon: GraduationCap },
    { label: "Comentários (30d)", value: data.totais.comentarios_30d, icon: MessageSquare },
    { label: "Aulas concluídas (30d)", value: data.totais.aulas_concluidas_30d, icon: CheckCircle2 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl space-y-8">
      <PageHeader
        title="Métricas"
        description="Visão consolidada de engajamento e conteúdo dos últimos 30 dias."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="mt-3 text-2xl font-black text-secondary">{c.value}</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">
              Comentários por dia (14d)
            </h2>
          </div>
          <div className="flex items-end gap-1 h-32">
            {data.comentarios_por_dia.map((d) => (
              <div key={d.data} className="flex-1 flex flex-col items-center justify-end" title={`${d.data}: ${d.total}`}>
                <div
                  className="w-full bg-primary/80 rounded-t"
                  style={{ height: `${(d.total / maxDia) * 100}%`, minHeight: d.total > 0 ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{data.comentarios_por_dia[0]?.data.slice(5)}</span>
            <span>{data.comentarios_por_dia.at(-1)?.data.slice(5)}</span>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-secondary mb-3">
            Aulas mais assistidas
          </h2>
          {data.aulas_mais_assistidas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.aulas_mais_assistidas.map((a, i) => {
                const max = data.aulas_mais_assistidas[0].visualizacoes || 1;
                return (
                  <li key={a.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-secondary">
                        {i + 1}. {a.titulo}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">{a.visualizacoes}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(a.visualizacoes / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary mb-3">
          Ambientes mais engajados (30d)
        </h2>
        {data.ambientes_mais_engajados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground text-left">
                <th className="py-2">Ambiente</th>
                <th className="py-2 text-right">Comentários</th>
                <th className="py-2 text-right">Conclusões</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.ambientes_mais_engajados.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-2 font-medium text-secondary">{a.nome}</td>
                  <td className="py-2 text-right">{a.comentarios}</td>
                  <td className="py-2 text-right">{a.conclusoes}</td>
                  <td className="py-2 text-right">
                    <Link
                      to="/admin/ambientes/$id"
                      params={{ id: a.id }}
                      className="text-xs text-primary hover:underline"
                    >
                      abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
