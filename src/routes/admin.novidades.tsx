import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

type Novidade = {
  id: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  imagem_url: string | null;
  fonte_nome: string | null;
  fonte_url: string | null;
  categoria: string | null;
  status: "rascunho" | "publicada" | "arquivada";
  publicado_em: string | null;
};

export const Route = createFileRoute("/admin/novidades")({
  component: NovidadesPage,
});

const FIELDS: FieldDef[] = [
  { name: "titulo", label: "Título", required: true },
  { name: "resumo", label: "Resumo", type: "textarea" },
  { name: "conteudo", label: "Conteúdo", type: "textarea" },
  { name: "imagem_url", label: "Imagem", type: "image", uploadFolder: "novidades", aspect: "aspect-video" },
  { name: "fonte_nome", label: "Fonte (nome)" },
  { name: "fonte_url", label: "Fonte (URL)", type: "url" },
  { name: "categoria", label: "Categoria" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      ["rascunho", "Rascunho"],
      ["publicada", "Publicada"],
      ["arquivada", "Arquivada"],
    ],
  },
];

function NovidadesPage() {
  const [items, setItems] = useState<Novidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Novidade | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("novidades")
      .select("id,titulo,resumo,conteudo,imagem_url,fonte_nome,fonte_url,categoria,status,publicado_em")
      .order("criado_em", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(data: Partial<Novidade>) {
    const status = (data.status as any) || "rascunho";
    const payload = {
      titulo: data.titulo!,
      resumo: data.resumo || null,
      conteudo: data.conteudo || null,
      imagem_url: data.imagem_url || null,
      fonte_nome: data.fonte_nome || null,
      fonte_url: data.fonte_url || null,
      categoria: data.categoria || null,
      status,
      publicado_em: status === "publicada" ? (editing?.publicado_em ?? new Date().toISOString()) : null,
    };
    if (editing) {
      const { error } = await supabase.from("novidades").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Novidade atualizada.");
    } else {
      const { error } = await supabase.from("novidades").insert(payload);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Novidade criada.");
    }
    setEditing(null);
    void load();
    return true;
  }

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Novidades"
        description="Cadastro global. Vincule a cada ambiente na tela do ambiente."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nova novidade
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma novidade cadastrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold text-secondary">{it.titulo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{it.categoria ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${it.status === "publicada" ? "bg-emerald-100 text-emerald-700" : it.status === "arquivada" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
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
        title={editing ? "Editar novidade" : "Nova novidade"}
        fields={FIELDS}
        initial={editing ?? { status: "rascunho" }}
        onSubmit={save}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
