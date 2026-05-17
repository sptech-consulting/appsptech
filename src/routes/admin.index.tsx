import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Layers,
  Wrench,
  Newspaper,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle2,
  PauseCircle,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Counts = {
  ambientes: { total: number; ativos: number };
  ferramentas: { total: number; ativas: number };
  novidades: { total: number; publicadas: number };
  aulas: { total: number; publicadas: number };
  alunos: { total: number; ativos: number };
};

type RecentImport = {
  id: string;
  ambiente_id: string;
  arquivo_nome: string | null;
  status: string;
  total_linhas: number | null;
  total_erros: number | null;
  criado_em: string;
};

type TopAmbiente = { id: string; nome: string; slug: string; alunos: number };

function AdminDashboard() {
  const [counts, setCounts] = useState<Counts>({
    ambientes: { total: 0, ativos: 0 },
    ferramentas: { total: 0, ativas: 0 },
    novidades: { total: 0, publicadas: 0 },
    aulas: { total: 0, publicadas: 0 },
    alunos: { total: 0, ativos: 0 },
  });
  const [recents, setRecents] = useState<RecentImport[]>([]);
  const [ambNames, setAmbNames] = useState<Record<string, string>>({});
  const [topAmbientes, setTopAmbientes] = useState<TopAmbiente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        amb, ambAtivos,
        fer, ferAtivas,
        nov, novPub,
        aul, aulPub,
        alu, aluAtivos,
        recImp,
        ambList,
        ambAlunosLink,
      ] = await Promise.all([
        supabase.from("ambientes").select("id", { count: "exact", head: true }),
        supabase.from("ambientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("ferramentas").select("id", { count: "exact", head: true }),
        supabase.from("ferramentas").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("novidades").select("id", { count: "exact", head: true }),
        supabase.from("novidades").select("id", { count: "exact", head: true }).eq("status", "publicada"),
        supabase.from("aulas").select("id", { count: "exact", head: true }),
        supabase.from("aulas").select("id", { count: "exact", head: true }).eq("status", "publicada"),
        supabase.from("alunos").select("id", { count: "exact", head: true }),
        supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase
          .from("importacoes_alunos")
          .select("id,ambiente_id,arquivo_nome,status,total_linhas,total_erros,criado_em")
          .order("criado_em", { ascending: false })
          .limit(5),
        supabase.from("ambientes").select("id,nome,slug"),
        supabase.from("ambiente_alunos").select("ambiente_id").eq("status", "ativo"),
      ]);

      setCounts({
        ambientes: { total: amb.count ?? 0, ativos: ambAtivos.count ?? 0 },
        ferramentas: { total: fer.count ?? 0, ativas: ferAtivas.count ?? 0 },
        novidades: { total: nov.count ?? 0, publicadas: novPub.count ?? 0 },
        aulas: { total: aul.count ?? 0, publicadas: aulPub.count ?? 0 },
        alunos: { total: alu.count ?? 0, ativos: aluAtivos.count ?? 0 },
      });
      setRecents((recImp.data as any) ?? []);
      const nameMap = Object.fromEntries(((ambList.data as any[]) ?? []).map((a) => [a.id, a.nome]));
      setAmbNames(nameMap);

      // Top ambientes por nº de alunos vinculados ativos
      const counts: Record<string, number> = {};
      ((ambAlunosLink.data as any[]) ?? []).forEach((r) => {
        counts[r.ambiente_id] = (counts[r.ambiente_id] ?? 0) + 1;
      });
      const top = ((ambList.data as any[]) ?? [])
        .map((a) => ({ id: a.id, nome: a.nome, slug: a.slug, alunos: counts[a.id] ?? 0 }))
        .sort((a, b) => b.alunos - a.alunos)
        .slice(0, 5);
      setTopAmbientes(top);

      setLoading(false);
    })();
  }, []);

  const cards = [
    {
      label: "Ambientes",
      icon: Layers,
      value: counts.ambientes.total,
      detail: `${counts.ambientes.ativos} ativos`,
      to: "/admin/ambientes",
    },
    {
      label: "Alunos",
      icon: Users,
      value: counts.alunos.total,
      detail: `${counts.alunos.ativos} ativos`,
      to: "/admin/alunos",
    },
    {
      label: "Ferramentas",
      icon: Wrench,
      value: counts.ferramentas.total,
      detail: `${counts.ferramentas.ativas} ativas`,
      to: "/admin/ferramentas",
    },
    {
      label: "Aulas",
      icon: GraduationCap,
      value: counts.aulas.total,
      detail: `${counts.aulas.publicadas} publicadas`,
      to: "/admin/aulas",
    },
    {
      label: "Novidades",
      icon: Newspaper,
      value: counts.novidades.total,
      detail: `${counts.novidades.publicadas} publicadas`,
      to: "/admin/novidades",
    },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <h1 className="text-3xl font-black text-secondary">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da plataforma SPTech.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <Icon className="h-4 w-4" />
                <ArrowRight className="h-3 w-3 opacity-50" />
              </div>
              <div className="mt-3 text-3xl font-black text-secondary">
                {loading ? "…" : c.value}
              </div>
              <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{c.detail}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {/* Top ambientes */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">
              Ambientes com mais alunos
            </h2>
            <Link to="/admin/ambientes" className="text-xs text-primary hover:underline">
              ver todos
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : topAmbientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ambiente cadastrado.</p>
            ) : (
              topAmbientes.map((a) => {
                const max = topAmbientes[0].alunos || 1;
                const pct = (a.alunos / max) * 100;
                return (
                  <Link
                    key={a.id}
                    to="/admin/ambientes/$id"
                    params={{ id: a.id }}
                    className="block group"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-secondary group-hover:text-primary truncate">
                        {a.nome}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {a.alunos} aluno{a.alunos === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Importações recentes */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">
              Importações recentes
            </h2>
            <Link to="/admin/importacoes" className="text-xs text-primary hover:underline">
              ver tudo
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : recents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma importação ainda.</p>
            ) : (
              recents.map((r) => {
                const icon =
                  r.status === "concluido" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : r.status === "concluido_com_erros" ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  ) : r.status === "falhou" ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  );
                return (
                  <Link
                    key={r.id}
                    to="/admin/importacoes"
                    className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs hover:bg-muted/40"
                  >
                    {icon}
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate text-secondary">
                      {r.arquivo_nome ?? r.id.slice(0, 8)}
                    </span>
                    <span className="text-muted-foreground hidden sm:inline">
                      {ambNames[r.ambiente_id] ?? "—"}
                    </span>
                    <span className="text-muted-foreground">{r.total_linhas ?? 0} linhas</span>
                    {(r.total_erros ?? 0) > 0 && (
                      <span className="text-amber-700 font-semibold">{r.total_erros} erros</span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">
          Próximos passos
        </h2>
        <ul className="mt-3 grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>
            Crie ambientes com identidade visual personalizada em <strong>Ambientes</strong>.
          </li>
          <li>
            Cadastre <strong>Ferramentas</strong>, <strong>Aulas</strong> e{" "}
            <strong>Novidades</strong> globais.
          </li>
          <li>Vincule esses conteúdos a cada ambiente para que apareçam para os alunos.</li>
          <li>
            Importe alunos por CSV e atribua aos ambientes em <strong>Alunos</strong>.
          </li>
          <li>
            Estruture acessos administrativos em <strong>Grupos & permissões</strong>.
          </li>
        </ul>
      </section>
    </div>
  );
}
