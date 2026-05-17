import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Ambiente = {
  id: string;
  nome: string;
  slug: string;
  status: string;
  cor_primaria: string | null;
  tema: string;
};

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [counts, setCounts] = useState({ ferramentas: 0, novidades: 0, aulas: 0, alunos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: amb }, fer, nov, aul, alu] = await Promise.all([
        supabase.from("ambientes").select("id,nome,slug,status,cor_primaria,tema").order("nome"),
        supabase.from("ferramentas").select("id", { count: "exact", head: true }),
        supabase.from("novidades").select("id", { count: "exact", head: true }),
        supabase.from("aulas").select("id", { count: "exact", head: true }),
        supabase.from("alunos").select("id", { count: "exact", head: true }),
      ]);
      setAmbientes(amb ?? []);
      setCounts({
        ferramentas: fer.count ?? 0,
        novidades: nov.count ?? 0,
        aulas: aul.count ?? 0,
        alunos: alu.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-black text-secondary">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da plataforma SPTech.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Ambientes" value={ambientes.length} />
        <Stat label="Ferramentas" value={counts.ferramentas} />
        <Stat label="Novidades" value={counts.novidades} />
        <Stat label="Aulas" value={counts.aulas} />
        <Stat label="Alunos" value={counts.alunos} />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-secondary">Ambientes</h2>
        <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
          ) : ambientes.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum ambiente disponível para sua conta.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-secondary">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Cor</th>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Tema</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {ambientes.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <span className="inline-block h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: a.cor_primaria ?? "#ccc" }} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-secondary">{a.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.tema}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          CRUD completo de ambientes + personalização visual chega na Fase 2.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-black text-secondary">{value}</div>
    </div>
  );
}
