import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Pencil, Power, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Ambiente = {
  id: string;
  nome: string;
  slug: string;
  status: "ativo" | "inativo" | "rascunho" | "arquivado";
  cor_primaria: string | null;
  cor_secundaria: string | null;
  tema: string;
  atualizado_em: string;
};

export const Route = createFileRoute("/admin/ambientes/")({
  component: AmbientesList,
});

function AmbientesList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ambientes")
      .select("id,nome,slug,status,cor_primaria,cor_secundaria,tema,atualizado_em")
      .order("nome");
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(a: Ambiente) {
    const next = a.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("ambientes").update({ status: next }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(`Ambiente ${next === "ativo" ? "ativado" : "inativado"}.`);
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title="Ambientes"
        description="Cada ambiente é uma área white-label com identidade visual própria."
        actions={
          <Button onClick={() => navigate({ to: "/admin/ambientes/novo" })}>
            <Plus className="h-4 w-4" /> Novo ambiente
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum ambiente ainda. Crie o primeiro.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Identidade</th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Tema</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: a.cor_primaria ?? "#ccc" }} />
                      <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: a.cor_secundaria ?? "#ccc" }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-secondary">{a.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{a.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{a.tema}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/e/${a.slug}/login`;
                          void navigator.clipboard.writeText(url);
                          toast.success("Link copiado", { description: url });
                        }}
                        title="Copiar link de acesso do aluno"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Link2 className="h-3 w-3" /> Copiar link
                      </button>
                      <a
                        href={`/e/${a.slug}/login`}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir link de acesso"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Link
                        to="/admin/ambientes/$id"
                        params={{ id: a.id }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </Link>
                      <button
                        onClick={() => toggleStatus(a)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Power className="h-3 w-3" /> {a.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo: "bg-emerald-100 text-emerald-700",
    inativo: "bg-zinc-200 text-zinc-700",
    rascunho: "bg-amber-100 text-amber-700",
    arquivado: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}
