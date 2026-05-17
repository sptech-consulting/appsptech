import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  PlayCircle,
  Folder,
} from "lucide-react";

export const Route = createFileRoute("/admin/cursos/$id")({
  component: CursoDetalhe,
});

type Curso = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: "rascunho" | "publicada" | "arquivada";
  categoria: string | null;
  nivel: string | null;
};

type Modulo = {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  status: "ativo" | "inativo";
};

type Aula = {
  id: string;
  titulo: string;
  descricao: string | null;
  modulo_id: string | null;
  ordem: number;
  duracao_minutos: number | null;
  tipo_conteudo: string | null;
  thumbnail_url: string | null;
  status: "rascunho" | "publicada" | "arquivada";
};

const MODULO_FIELDS: FieldDef[] = [
  { name: "titulo", label: "Título do módulo", required: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
];

function CursoDetalhe() {
  const { id } = Route.useParams();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulasDisponiveis, setAulasDisponiveis] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModulo, setExpandedModulo] = useState<string | null>(null);
  const [modOpen, setModOpen] = useState(false);
  const [editingMod, setEditingMod] = useState<Modulo | null>(null);
  const [pickerModulo, setPickerModulo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, mRes] = await Promise.all([
      supabase.from("cursos").select("id,titulo,descricao,status,categoria,nivel").eq("id", id).single(),
      supabase.from("modulos").select("id,curso_id,titulo,descricao,ordem,status").eq("curso_id", id).order("ordem"),
    ]);
    if (cRes.error) toast.error(cRes.error.message);
    setCurso((cRes.data as Curso) ?? null);
    const mods = ((mRes.data as Modulo[]) ?? []).sort((a, b) => a.ordem - b.ordem);
    setModulos(mods);

    if (mods.length > 0) {
      const modIds = mods.map((m) => m.id);
      const aRes = await supabase
        .from("aulas")
        .select("id,titulo,descricao,modulo_id,ordem,duracao_minutos,tipo_conteudo,thumbnail_url,status")
        .in("modulo_id", modIds)
        .order("ordem");
      setAulas(((aRes.data as Aula[]) ?? []).sort((a, b) => a.ordem - b.ordem));
    } else {
      setAulas([]);
    }

    const disp = await supabase
      .from("aulas")
      .select("id,titulo,descricao,modulo_id,ordem,duracao_minutos,tipo_conteudo,thumbnail_url,status")
      .is("modulo_id", null)
      .order("titulo");
    setAulasDisponiveis(((disp.data as Aula[]) ?? []) as Aula[]);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveModulo(data: Partial<Modulo>) {
    const payload: any = {
      titulo: data.titulo,
      descricao: data.descricao || null,
      curso_id: id,
    };
    if (editingMod) {
      const { error } = await supabase.from("modulos").update(payload).eq("id", editingMod.id);
      if (error) return toast.error(error.message), false;
    } else {
      const ordem = modulos.length;
      const { error } = await supabase.from("modulos").insert({ ...payload, ordem });
      if (error) return toast.error(error.message), false;
    }
    setEditingMod(null);
    void load();
    return true;
  }

  async function removerModulo(modId: string) {
    if (!confirm("Remover este módulo? As aulas vinculadas serão desvinculadas (não excluídas).")) return;
    // primeiro desvincula aulas
    await supabase.from("aulas").update({ modulo_id: null, ordem: 0 }).eq("modulo_id", modId);
    const { error } = await supabase.from("modulos").delete().eq("id", modId);
    if (error) return toast.error(error.message);
    toast.success("Módulo removido.");
    void load();
  }

  async function moverModulo(modId: string, dir: -1 | 1) {
    const idx = modulos.findIndex((m) => m.id === modId);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= modulos.length) return;
    const a = modulos[idx];
    const b = modulos[target];
    await Promise.all([
      supabase.from("modulos").update({ ordem: b.ordem }).eq("id", a.id),
      supabase.from("modulos").update({ ordem: a.ordem }).eq("id", b.id),
    ]);
    void load();
  }

  async function vincularAula(modId: string, aulaId: string) {
    const aulasMod = aulas.filter((a) => a.modulo_id === modId);
    const ordem = aulasMod.length;
    const { error } = await supabase.from("aulas").update({ modulo_id: modId, ordem }).eq("id", aulaId);
    if (error) return toast.error(error.message);
    toast.success("Aula vinculada ao módulo.");
    setPickerModulo(null);
    void load();
  }

  async function desvincularAula(aulaId: string) {
    const { error } = await supabase.from("aulas").update({ modulo_id: null, ordem: 0 }).eq("id", aulaId);
    if (error) return toast.error(error.message);
    void load();
  }

  async function moverAula(aulaId: string, dir: -1 | 1) {
    const aula = aulas.find((a) => a.id === aulaId);
    if (!aula || !aula.modulo_id) return;
    const irmas = aulas.filter((a) => a.modulo_id === aula.modulo_id).sort((a, b) => a.ordem - b.ordem);
    const idx = irmas.findIndex((a) => a.id === aulaId);
    const target = idx + dir;
    if (target < 0 || target >= irmas.length) return;
    const other = irmas[target];
    await Promise.all([
      supabase.from("aulas").update({ ordem: other.ordem }).eq("id", aula.id),
      supabase.from("aulas").update({ ordem: aula.ordem }).eq("id", other.id),
    ]);
    void load();
  }

  if (loading && !curso) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!curso) {
    return <div className="p-8 text-sm text-muted-foreground">Curso não encontrado.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <Link
        to="/admin/cursos"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar para cursos
      </Link>

      <PageHeader
        title={curso.titulo}
        description={curso.descricao ?? "Organize o conteúdo do curso em módulos e aulas."}
        actions={
          <Button
            onClick={() => {
              setEditingMod(null);
              setModOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo módulo
          </Button>
        }
      />

      {modulos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Folder className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Este curso ainda não tem módulos. Crie o primeiro para começar a estruturar as aulas.
          </p>
          <Button
            onClick={() => {
              setEditingMod(null);
              setModOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Criar primeiro módulo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {modulos.map((mod, idx) => {
            const expanded = expandedModulo === mod.id;
            const aulasMod = aulas.filter((a) => a.modulo_id === mod.id).sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
                  <button
                    onClick={() => setExpandedModulo(expanded ? null : mod.id)}
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                  >
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex flex-col">
                    <button
                      disabled={idx === 0}
                      onClick={() => moverModulo(mod.id, -1)}
                      className="text-muted-foreground hover:text-secondary disabled:opacity-30"
                      title="Subir"
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </button>
                    <button
                      disabled={idx === modulos.length - 1}
                      onClick={() => moverModulo(mod.id, 1)}
                      className="text-muted-foreground hover:text-secondary disabled:opacity-30"
                      title="Descer"
                    >
                      <GripVertical className="h-3 w-3 -rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-secondary">
                      <span className="text-muted-foreground font-normal mr-2">{String(idx + 1).padStart(2, "0")}.</span>
                      {mod.titulo}
                    </div>
                    {mod.descricao && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{mod.descricao}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {aulasMod.length} aula{aulasMod.length === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={() => {
                      setEditingMod(mod);
                      setModOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button
                    onClick={() => removerModulo(mod.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {expanded && (
                  <div className="p-4 space-y-2">
                    {aulasMod.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">Sem aulas neste módulo ainda.</div>
                    ) : (
                      aulasMod.map((a, ai) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <button
                              disabled={ai === 0}
                              onClick={() => moverAula(a.id, -1)}
                              className="text-muted-foreground hover:text-secondary disabled:opacity-30 text-[10px]"
                            >
                              ▲
                            </button>
                            <button
                              disabled={ai === aulasMod.length - 1}
                              onClick={() => moverAula(a.id, 1)}
                              className="text-muted-foreground hover:text-secondary disabled:opacity-30 text-[10px]"
                            >
                              ▼
                            </button>
                          </div>
                          <div
                            className="h-9 w-14 rounded bg-muted bg-cover bg-center shrink-0 flex items-center justify-center"
                            style={a.thumbnail_url ? { backgroundImage: `url(${a.thumbnail_url})` } : undefined}
                          >
                            {!a.thumbnail_url && <PlayCircle className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-secondary truncate">{a.titulo}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                              {a.duracao_minutos && <span>{a.duracao_minutos} min</span>}
                              {a.tipo_conteudo && <span className="capitalize">{a.tipo_conteudo}</span>}
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                                  a.status === "publicada"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : a.status === "arquivada"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {a.status}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => desvincularAula(a.id)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                            title="Desvincular do módulo"
                          >
                            Desvincular
                          </button>
                        </div>
                      ))
                    )}

                    {pickerModulo === mod.id ? (
                      <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                        <div className="text-xs font-semibold mb-2">
                          Aulas disponíveis (sem módulo) — clique para vincular:
                        </div>
                        {aulasDisponiveis.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic">
                            Nenhuma aula disponível.{" "}
                            <Link to="/admin/aulas" className="text-primary font-semibold hover:underline">
                              Criar uma aula
                            </Link>
                            .
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {aulasDisponiveis.map((a) => (
                              <button
                                key={a.id}
                                onClick={() => vincularAula(mod.id, a.id)}
                                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition"
                              >
                                {a.titulo}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setPickerModulo(null)}
                          className="mt-3 text-xs text-muted-foreground hover:text-secondary"
                        >
                          Fechar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPickerModulo(mod.id)}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Plus className="h-3 w-3" /> Vincular aula a este módulo
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RecordDialog
        title={editingMod ? "Editar módulo" : "Novo módulo"}
        fields={MODULO_FIELDS}
        initial={editingMod ?? {}}
        onSubmit={saveModulo}
        open={modOpen}
        onOpenChange={setModOpen}
      />
    </div>
  );
}
