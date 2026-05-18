import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ExternalLink, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Ferramenta = {
  id: string;
  nome: string;
  descricao: string | null;
  url: string | null;
  icone_url: string | null;
  categoria: string | null;
  tipo_abertura: "nova_aba" | "mesma_aba" | "modal" | null;
  status: "ativo" | "inativo";
};

export const Route = createFileRoute("/admin/ferramentas/")({
  component: FerramentasPage,
});

function FerramentasPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ferramentas")
      .select("id,nome,descricao,url,icone_url,categoria,tipo_abertura,status")
      .order("nome");
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function criarNova() {
    const { data, error } = await supabase
      .from("ferramentas")
      .insert({ nome: "Nova ferramenta", status: "inativo", tipo_abertura: "nova_aba" })
      .select("id")
      .single();
    if (error || !data) return toast.error(error?.message ?? "Erro ao criar");
    navigate({ to: "/admin/ferramentas/$id", params: { id: data.id } });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title="Ferramentas"
        description="Cadastro global. Vincule a cada ambiente na tela do ambiente."
        actions={
          <Button onClick={() => void criarNova()}>
            <Plus className="h-4 w-4" /> Nova ferramenta
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma ferramenta cadastrada.</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">URL</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold text-secondary">{it.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{it.categoria ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {it.url ? (
                      <a href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        {it.url.replace(/^https?:\/\//, "").slice(0, 28)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${it.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"}`}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => navigate({ to: "/admin/ferramentas/$id", params: { id: it.id } })}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={async () => {
                          const novo = it.status === "ativo" ? "inativo" : "ativo";
                          const { error } = await supabase.from("ferramentas").update({ status: novo }).eq("id", it.id);
                          if (error) return toast.error(error.message);
                          toast.success(novo === "inativo" ? "Ferramenta inativada." : "Ferramenta restaurada.");
                          void load();
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                        title={it.status === "ativo" ? "Inativar" : "Restaurar"}
                      >
                        {it.status === "ativo" ? <><Archive className="h-3 w-3" /> Inativar</> : <><RotateCcw className="h-3 w-3" /> Restaurar</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
