import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Wrench, Newspaper, GraduationCap, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [counts, setCounts] = useState({ ambientes: 0, ferramentas: 0, novidades: 0, aulas: 0, alunos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [amb, fer, nov, aul, alu] = await Promise.all([
        supabase.from("ambientes").select("id", { count: "exact", head: true }),
        supabase.from("ferramentas").select("id", { count: "exact", head: true }),
        supabase.from("novidades").select("id", { count: "exact", head: true }),
        supabase.from("aulas").select("id", { count: "exact", head: true }),
        supabase.from("alunos").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        ambientes: amb.count ?? 0,
        ferramentas: fer.count ?? 0,
        novidades: nov.count ?? 0,
        aulas: aul.count ?? 0,
        alunos: alu.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Ambientes", icon: Layers, value: counts.ambientes, to: "/admin/ambientes" },
    { label: "Ferramentas", icon: Wrench, value: counts.ferramentas, to: "/admin/ferramentas" },
    { label: "Novidades", icon: Newspaper, value: counts.novidades, to: "/admin/novidades" },
    { label: "Aulas", icon: GraduationCap, value: counts.aulas, to: "/admin/aulas" },
    { label: "Alunos", icon: Users, value: counts.alunos, to: "/admin" },
  ] as const;

  return (
    <div className="p-8 max-w-6xl">
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
              <div className="mt-3 text-3xl font-black text-secondary">{loading ? "…" : c.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-secondary">Próximos passos</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>Crie ambientes com identidade visual personalizada em <strong>Ambientes</strong>.</li>
          <li>Cadastre <strong>Ferramentas</strong>, <strong>Novidades</strong> e <strong>Aulas</strong> globais.</li>
          <li>Vincule esses conteúdos a cada ambiente para que apareçam para os alunos.</li>
        </ul>
      </section>
    </div>
  );
}
