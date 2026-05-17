import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import { Plus, Pencil, BookOpen } from "lucide-react";
import { toast } from "sonner";

type Curso = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  categoria: string | null;
  carga_horaria_minutos: number | null;
  nivel: string | null;
  status: "rascunho" | "publicada" | "arquivada";
};

export const Route = createFileRoute("/admin/cursos")({
  component: CursosPage,
});

const FIELDS: FieldDef[] = [
  { name: "titulo", label: "Título", required: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
  { name: "categoria", label: "Categoria" },
  {
    name: "nivel",
    label: "Nível",
    type: "select",
    options: [
      ["iniciante", "Iniciante"],
      ["intermediario", "Intermediário"],
      ["avancado", "Avançado"],
    ],
  },
  { name: "carga_horaria_minutos", label: "Carga horária (min)", type: "number" },
  { name: "capa_url", label: "Capa do curso", type: "image", uploadFolder: "cursos/capa", aspect: "aspect-video" },
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

function CursosPage() {
  const [items, setItems] = useState<Curso[]>([]);
  const [counts, setCounts] = useState<Record<string, { modulos: number; aulas: number }>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cursos")
      .select("id,titulo,descricao,capa_url,categoria,carga_horaria_minutos,nivel,status")
      .order("titulo");
    if (error) toast.error(error.message);
    const list = (data ?? []) as Curso[];
    setItems(list);

    if (list.length > 0) {
      const ids = list.map((c) => c.id);
      const [mods, aulas] = await Promise.all([
        supabase.from("modulos").select("id,curso_id").in("curso_id", ids),
        supabase.from("aulas").select("id,modulo_id").not("modulo_id", "is", null),
      ]);
      const modByCurso: Record<string, Set<string>> = {};
      for (const m of (mods.data ?? []) as { id: string; curso_id: string }[]) {
        modByCurso[m.curso_id] = modByCurso[m.curso_id] ?? new Set();
        modByCurso[m.curso_id].add(m.id);
      }
      const aulasByModulo: Record<string, number> = {};
      for (const a of (aulas.data ?? []) as { modulo_id: string }[]) {
        aulasByModulo[a.modulo_id] = (aulasByModulo[a.modulo_id] ?? 0) + 1;
      }
      const c: Record<string, { modulos: number; aulas: number }> = {};
      for (const id of ids) {
        const ms = modByCurso[id] ?? new Set<string>();
        let aulaCount = 0;
        for (const mid of ms) aulaCount += aulasByModulo[mid] ?? 0;
        c[id] = { modulos: ms.size, aulas: aulaCount };
      }
      setCounts(c);
    } else {
      setCounts({});
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(data: Partial<Curso>) {
    const payload = {
      titulo: data.titulo!,
      descricao: data.descricao || null,
      categoria: data.categoria || null,
      nivel: data.nivel || null,
      carga_horaria_minutos: data.carga_horaria_minutos ?? null,
      capa_url: data.capa_url || null,
      status: (data.status as any) || "rascunho",
    };
    if (editing) {
      const { error } = await supabase.from("cursos").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message), false;
      toast.success("Curso atualizado.");
    } else {
      const { error } = await supabase.from("cursos").insert(payload);
      if (error) return toast.error(error.message), false;
      toast.success("Curso criado.");
    }
    setEditing(null);
    void load();
    return true;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title="Cursos"
        description="Cadastre cursos globais. Adicione módulos e aulas dentro de cada curso. Vincule depois aos ambientes."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo curso
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            Nenhum curso cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Curso</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Nível</th>
                <th className="px-4 py-3 font-semibold">Conteúdo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const c = counts[it.id] ?? { modulos: 0, aulas: 0 };
                return (
                  <tr key={it.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-16 rounded bg-muted bg-cover bg-center shrink-0"
                          style={it.capa_url ? { backgroundImage: `url(${it.capa_url})` } : undefined}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-secondary truncate">{it.titulo}</div>
                          {it.descricao && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{it.descricao}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{it.categoria ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{it.nivel ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.modulos} módulo{c.modulos === 1 ? "" : "s"} · {c.aulas} aula{c.aulas === 1 ? "" : "s"}
                    </td>
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
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(it);
                            setOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                        <Link
                          to="/admin/cursos/$id"
                          params={{ id: it.id }}
                          className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold hover:opacity-90"
                        >
                          Estrutura <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      <RecordDialog
        title={editing ? "Editar curso" : "Novo curso"}
        fields={FIELDS}
        initial={editing ?? { status: "rascunho" }}
        onSubmit={save}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
