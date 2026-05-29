import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Star } from "lucide-react";
import { toast } from "sonner";

type Trabalho = {
  id: string;
  ambiente_id: string;
  titulo: string;
  autor_nome: string;
  turma: string | null;
  status: "rascunho" | "publicada" | "arquivada";
  destaque: boolean;
};

type Ambiente = { id: string; nome: string };

export const Route = createFileRoute("/admin/trabalhos/")({
  component: TrabalhosPage,
});

function TrabalhosPage() {
  const [items, setItems] = useState<Trabalho[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteFiltro, setAmbienteFiltro] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const ambsP = supabase.from("ambientes").select("id,nome").order("nome");
    let q = supabase
      .from("trabalhos")
      .select("id,ambiente_id,titulo,autor_nome,turma,status,destaque")
      .order("destaque", { ascending: false })
      .order("criado_em", { ascending: false });
    if (ambienteFiltro) q = q.eq("ambiente_id", ambienteFiltro);
    const [{ data: ambs }, { data, error }] = await Promise.all([ambsP, q]);
    if (error) toast.error(error.message);
    setAmbientes((ambs ?? []) as Ambiente[]);
    setItems(((data as unknown) as Trabalho[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienteFiltro]);

  async function toggleDestaque(t: Trabalho) {
    const { error } = await supabase
      .from("trabalhos")
      .update({ destaque: !t.destaque })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    void load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title="Trabalhos (Mural de Resultados)"
        description="Curadoria dos trabalhos enviados pelos alunos. Publicados aparecem no mural acessado por código do ambiente."
        actions={
          <Button asChild>
            <Link
              to="/admin/trabalhos/$id"
              params={{ id: "novo" }}
              search={ambienteFiltro ? { ambiente: ambienteFiltro } : undefined}
            >
              <Plus className="h-4 w-4" /> Novo trabalho
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Filtrar por ambiente
        </label>
        <select
          value={ambienteFiltro}
          onChange={(e) => setAmbienteFiltro(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-2 text-sm"
        >
          <option value="">Todos</option>
          {ambientes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum trabalho cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted text-secondary">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold w-10"></th>
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Autor(es)</th>
                  <th className="px-4 py-3 font-semibold">Ambiente</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const amb = ambientes.find((a) => a.id === it.ambiente_id);
                  return (
                    <tr key={it.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <button
                          title={it.destaque ? "Remover destaque" : "Marcar destaque"}
                          onClick={() => toggleDestaque(it)}
                          className="text-amber-500 hover:scale-110 transition"
                        >
                          <Star className={`h-4 w-4 ${it.destaque ? "fill-amber-500" : ""}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-secondary">{it.titulo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{it.autor_nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{amb?.nome ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            it.status === "publicada"
                              ? "bg-emerald-100 text-emerald-700"
                              : it.status === "arquivada"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {it.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/admin/trabalhos/$id"
                          params={{ id: it.id }}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
