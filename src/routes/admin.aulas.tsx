import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

type Aula = {
  id: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  material_url: string | null;
  thumbnail_url: string | null;
  modulo: string | null;
  duracao_minutos: number | null;
  tipo_conteudo: "video" | "texto" | "pdf" | "link" | "misto" | null;
  status: "rascunho" | "publicada" | "arquivada";
};

export const Route = createFileRoute("/admin/aulas")({
  component: AulasPage,
});

const FIELDS: FieldDef[] = [
  { name: "titulo", label: "Título", required: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "modulo", label: "Módulo" },
  { name: "video_url", label: "Vídeo (URL)", type: "url" },
  { name: "material_url", label: "Material (URL)", type: "url" },
  { name: "thumbnail_url", label: "Thumbnail", type: "image", uploadFolder: "aulas/thumbs", aspect: "aspect-video" },
  { name: "duracao_minutos", label: "Duração (min)", type: "number" },
  {
    name: "tipo_conteudo",
    label: "Tipo",
    type: "select",
    options: [
      ["video", "Vídeo"],
      ["texto", "Texto"],
      ["pdf", "PDF"],
      ["link", "Link"],
      ["misto", "Misto"],
    ],
  },
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

function AulasPage() {
  const [items, setItems] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aula | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("aulas")
      .select("id,titulo,descricao,video_url,material_url,thumbnail_url,modulo,duracao_minutos,tipo_conteudo,status")
      .order("titulo");
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(data: Partial<Aula>) {
    const payload = {
      titulo: data.titulo!,
      descricao: data.descricao || null,
      video_url: data.video_url || null,
      material_url: data.material_url || null,
      thumbnail_url: data.thumbnail_url || null,
      modulo: data.modulo || null,
      duracao_minutos: data.duracao_minutos ?? null,
      tipo_conteudo: (data.tipo_conteudo as any) || "video",
      status: (data.status as any) || "rascunho",
    };
    if (editing) {
      const { error } = await supabase.from("aulas").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Aula atualizada.");
    } else {
      const { error } = await supabase.from("aulas").insert(payload);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Aula criada.");
    }
    setEditing(null);
    void load();
    return true;
  }

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Aulas"
        description="Cadastro global. Vincule a cada ambiente na tela do ambiente."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nova aula
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma aula cadastrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Módulo</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Duração</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold text-secondary">{it.titulo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{it.modulo ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{it.tipo_conteudo ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{it.duracao_minutos ? `${it.duracao_minutos} min` : "—"}</td>
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
        title={editing ? "Editar aula" : "Nova aula"}
        fields={FIELDS}
        initial={editing ?? { status: "rascunho", tipo_conteudo: "video" }}
        onSubmit={save}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
