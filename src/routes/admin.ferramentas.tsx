import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import { Plus, Pencil, ExternalLink } from "lucide-react";
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

export const Route = createFileRoute("/admin/ferramentas")({
  component: FerramentasPage,
});

const FIELDS: FieldDef[] = [
  { name: "nome", label: "Nome", required: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "url", label: "URL", type: "url", placeholder: "https://…" },
  { name: "icone_url", label: "Ícone", type: "image", uploadFolder: "ferramentas/icones", aspect: "aspect-square" },
  { name: "categoria", label: "Categoria" },
  {
    name: "tipo_abertura",
    label: "Abertura",
    type: "select",
    options: [
      ["nova_aba", "Nova aba"],
      ["mesma_aba", "Mesma aba"],
      ["modal", "Modal"],
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      ["ativo", "Ativo"],
      ["inativo", "Inativo"],
    ],
  },
];

function FerramentasPage() {
  const [items, setItems] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ferramenta | null>(null);

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

  async function save(data: Partial<Ferramenta>) {
    const payload = {
      nome: data.nome!,
      descricao: data.descricao || null,
      url: data.url || null,
      icone_url: data.icone_url || null,
      categoria: data.categoria || null,
      tipo_abertura: (data.tipo_abertura as any) || "nova_aba",
      status: (data.status as any) || "ativo",
    };
    if (editing) {
      const { error } = await supabase.from("ferramentas").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Ferramenta atualizada.");
    } else {
      const { error } = await supabase.from("ferramentas").insert(payload);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Ferramenta criada.");
    }
    setEditing(null);
    void load();
    return true;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title="Ferramentas"
        description="Cadastro global. Vincule a cada ambiente na tela do ambiente."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
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
          <table className="w-full text-sm">
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
                    <button
                      onClick={() => {
                        setEditing(it);
                        setOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RecordDialog
        title={editing ? "Editar ferramenta" : "Nova ferramenta"}
        fields={FIELDS}
        initial={editing ?? { tipo_abertura: "nova_aba", status: "ativo" }}
        onSubmit={save}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
