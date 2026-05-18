import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import { ImageUpload } from "@/components/ImageUpload";
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
  Save,
  BookOpen,
  GraduationCap,
  Layers,
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
  carga_horaria_minutos: number | null;
  capa_url: string | null;
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
  video_url: string | null;
  material_url: string | null;
  status: "rascunho" | "publicada" | "arquivada";
};

const MODULO_FIELDS: FieldDef[] = [
  { name: "titulo", label: "Título do módulo", required: true },
  { name: "descricao", label: "Descrição", type: "textarea" },
];

type TabKey = "curso" | "modulos" | "aulas";

function CursoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("curso");

  const [curso, setCurso] = useState<Curso | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, mRes] = await Promise.all([
      supabase
        .from("cursos")
        .select("id,titulo,descricao,status,categoria,nivel,carga_horaria_minutos,capa_url")
        .eq("id", id)
        .single(),
      supabase
        .from("modulos")
        .select("id,curso_id,titulo,descricao,ordem,status")
        .eq("curso_id", id)
        .order("ordem"),
    ]);
    if (cRes.error) toast.error(cRes.error.message);
    setCurso((cRes.data as Curso) ?? null);
    const mods = ((mRes.data as Modulo[]) ?? []).sort((a, b) => a.ordem - b.ordem);
    setModulos(mods);

    if (mods.length > 0) {
      const modIds = mods.map((m) => m.id);
      const aRes = await supabase
        .from("aulas")
        .select(
          "id,titulo,descricao,modulo_id,ordem,duracao_minutos,tipo_conteudo,thumbnail_url,video_url,material_url,status",
        )
        .in("modulo_id", modIds)
        .order("ordem");
      setAulas(((aRes.data as Aula[]) ?? []).sort((a, b) => a.ordem - b.ordem));
    } else {
      setAulas([]);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !curso) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!curso) {
    return <div className="p-8 text-sm text-muted-foreground">Curso não encontrado.</div>;
  }

  const tabs: { key: TabKey; label: string; icon: typeof BookOpen; count?: number }[] = [
    { key: "curso", label: "Curso", icon: BookOpen },
    { key: "modulos", label: "Módulos", icon: Layers, count: modulos.length },
    { key: "aulas", label: "Aulas", icon: GraduationCap, count: aulas.length },
  ];

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
        description={curso.descricao ?? "Edite as informações, organize módulos e aulas deste curso."}
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {typeof t.count === "number" && (
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-secondary"
                  }`}
                >
                  {t.count}
                </span>
              )}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {tab === "curso" && (
        <div className="space-y-5">
          <CursoForm
            curso={curso}
            onSaved={(c) => setCurso(c)}
            onDeleted={() => navigate({ to: "/admin/cursos" })}
          />
          <AmbientesVinculados cursoId={id} />
        </div>
      )}

      {tab === "modulos" && (
        <ModulosTab
          cursoId={id}
          modulos={modulos}
          aulas={aulas}
          onChanged={load}
        />
      )}

      {tab === "aulas" && (
        <AulasTab
          modulos={modulos}
          aulas={aulas}
          onChanged={load}
          onGoToModulos={() => setTab("modulos")}
        />
      )}
    </div>
  );
}

// ===================== Tab: Curso =====================

function CursoForm({
  curso,
  onSaved,
  onDeleted,
}: {
  curso: Curso;
  onSaved: (c: Curso) => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<Curso>(curso);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(curso), [curso]);

  async function save() {
    setBusy(true);
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria || null,
      nivel: form.nivel || null,
      carga_horaria_minutos: form.carga_horaria_minutos ?? null,
      capa_url: form.capa_url || null,
      status: form.status,
    };
    const { data, error } = await supabase
      .from("cursos")
      .update(payload)
      .eq("id", curso.id)
      .select("id,titulo,descricao,status,categoria,nivel,carga_horaria_minutos,capa_url")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Curso atualizado.");
    if (data) onSaved(data as Curso);
  }

  async function remover() {
    if (!confirm("Arquivar este curso? Os módulos e vínculos com ambientes permanecem.")) return;
    const { error } = await supabase.from("cursos").update({ status: "arquivada" }).eq("id", curso.id);
    if (error) return toast.error(error.message);
    toast.success("Curso arquivado.");
    onDeleted();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4 max-w-3xl">
      <Field label="Título" required>
        <input
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        />
      </Field>
      <Field label="Descrição">
        <textarea
          value={form.descricao ?? ""}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Categoria">
          <input
            value={form.categoria ?? ""}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Nível">
          <select
            value={form.nivel ?? ""}
            onChange={(e) => setForm({ ...form, nivel: e.target.value || null })}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="">—</option>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </Field>
        <Field label="Carga horária (min)">
          <input
            type="number"
            value={form.carga_horaria_minutos ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                carga_horaria_minutos: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Curso["status"] })}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="rascunho">Rascunho</option>
            <option value="publicada">Publicada</option>
            <option value="arquivada">Arquivada</option>
          </select>
        </Field>
      </div>

      <Field label="Capa do curso">
        <CapaUpload value={form.capa_url} onChange={(url) => setForm({ ...form, capa_url: url })} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
        <button
          onClick={remover}
          className="text-xs font-semibold text-destructive hover:underline"
        >
          Arquivar curso
        </button>
        <Button onClick={save} disabled={busy}>
          <Save className="h-4 w-4" /> {busy ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-secondary">
        {label}
        {required && " *"}
      </div>
      {children}
    </div>
  );
}

function CapaUpload({ value, onChange }: { value: string | null; onChange: (u: string | null) => void }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      folder="cursos/capa"
      aspect="aspect-video"
    />
  );
}

// ===================== Tab: Módulos =====================

function ModulosTab({
  cursoId,
  modulos,
  aulas,
  onChanged,
}: {
  cursoId: string;
  modulos: Modulo[];
  aulas: Aula[];
  onChanged: () => void | Promise<void>;
}) {
  const [modOpen, setModOpen] = useState(false);
  const [editingMod, setEditingMod] = useState<Modulo | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function saveModulo(data: Partial<Modulo>) {
    const payload: any = {
      titulo: data.titulo,
      descricao: data.descricao || null,
      curso_id: cursoId,
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
    void onChanged();
    return true;
  }

  async function removerModulo(modId: string) {
    if (!confirm("Remover este módulo? As aulas vinculadas serão desvinculadas (não excluídas).")) return;
    await supabase.from("aulas").update({ modulo_id: null, ordem: 0 }).eq("modulo_id", modId);
    const { error } = await supabase.from("modulos").delete().eq("id", modId);
    if (error) return toast.error(error.message);
    toast.success("Módulo removido.");
    void onChanged();
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
    void onChanged();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Organize o conteúdo do curso em módulos. As aulas são gerenciadas na aba <b>Aulas</b>.
        </p>
        <Button
          onClick={() => {
            setEditingMod(null);
            setModOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo módulo
        </Button>
      </div>

      {modulos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Folder className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Este curso ainda não tem módulos.
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
            const isOpen = expanded === mod.id;
            const aulasMod = aulas.filter((a) => a.modulo_id === mod.id).sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
                  <button
                    onClick={() => setExpanded(isOpen ? null : mod.id)}
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                      <span className="text-muted-foreground font-normal mr-2">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      {mod.titulo}
                    </div>
                    {mod.descricao && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{mod.descricao}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {aulasMod.length} aula{aulasMod.length === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={() => {
                      setEditingMod(mod);
                      setModOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removerModulo(mod.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {isOpen && (
                  <div className="p-4">
                    {aulasMod.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">
                        Sem aulas neste módulo. Use a aba <b>Aulas</b> para adicionar.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {aulasMod.map((a, ai) => (
                          <li key={a.id} className="flex items-center gap-2 text-sm">
                            <span className="text-xs text-muted-foreground w-6">{ai + 1}.</span>
                            <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-secondary">{a.titulo}</span>
                          </li>
                        ))}
                      </ul>
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

// ===================== Tab: Aulas =====================

function AulasTab({
  modulos,
  aulas,
  onChanged,
  onGoToModulos,
}: {
  modulos: Modulo[];
  aulas: Aula[];
  onChanged: () => void | Promise<void>;
  onGoToModulos: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aula | null>(null);
  const [defaultModuloId, setDefaultModuloId] = useState<string | null>(null);

  const FIELDS: FieldDef[] = [
    {
      name: "modulo_id",
      label: "Módulo",
      type: "select",
      required: true,
      options: modulos.map((m) => [m.id, m.titulo] as [string, string]),
    },
    { name: "titulo", label: "Título", required: true },
    { name: "descricao", label: "Descrição", type: "textarea" },
    { name: "video_url", label: "Vídeo (URL)", type: "url" },
    { name: "material_url", label: "Material (URL)", type: "url" },
    {
      name: "thumbnail_url",
      label: "Thumbnail",
      type: "image",
      uploadFolder: "aulas/thumbs",
      aspect: "aspect-video",
    },
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

  async function save(data: Partial<Aula>) {
    if (!data.modulo_id) {
      toast.error("Selecione um módulo.");
      return false;
    }
    const irmas = aulas.filter((a) => a.modulo_id === data.modulo_id);
    const payload: any = {
      titulo: data.titulo,
      descricao: data.descricao || null,
      modulo_id: data.modulo_id,
      video_url: data.video_url || null,
      material_url: data.material_url || null,
      thumbnail_url: data.thumbnail_url || null,
      duracao_minutos: data.duracao_minutos ?? null,
      tipo_conteudo: (data.tipo_conteudo as any) || "video",
      status: (data.status as any) || "rascunho",
    };
    if (editing) {
      const { error } = await supabase.from("aulas").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message), false;
      toast.success("Aula atualizada.");
    } else {
      const { error } = await supabase
        .from("aulas")
        .insert({ ...payload, ordem: irmas.length });
      if (error) return toast.error(error.message), false;
      toast.success("Aula criada.");
    }
    setEditing(null);
    void onChanged();
    return true;
  }

  async function remover(aulaId: string) {
    if (!confirm("Remover esta aula? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("aulas").delete().eq("id", aulaId);
    if (error) return toast.error(error.message);
    toast.success("Aula removida.");
    void onChanged();
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
    void onChanged();
  }

  if (modulos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Crie pelo menos um módulo antes de adicionar aulas.
        </p>
        <Button onClick={onGoToModulos}>
          <Layers className="h-4 w-4" /> Ir para módulos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Aulas deste curso, agrupadas por módulo.
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setDefaultModuloId(modulos[0]?.id ?? null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova aula
        </Button>
      </div>

      <div className="space-y-4">
        {modulos.map((mod) => {
          const aulasMod = aulas.filter((a) => a.modulo_id === mod.id).sort((a, b) => a.ordem - b.ordem);
          return (
            <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                <div className="font-bold text-sm text-secondary">{mod.titulo}</div>
                <button
                  onClick={() => {
                    setEditing(null);
                    setDefaultModuloId(mod.id);
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> Aula
                </button>
              </div>
              {aulasMod.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground italic">
                  Nenhuma aula neste módulo.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {aulasMod.map((a, ai) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
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
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
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
                        onClick={() => {
                          setEditing(a);
                          setDefaultModuloId(a.modulo_id);
                          setOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => remover(a.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <RecordDialog
        title={editing ? "Editar aula" : "Nova aula"}
        fields={FIELDS}
        initial={
          editing ?? {
            modulo_id: defaultModuloId,
            status: "rascunho",
            tipo_conteudo: "video",
          }
        }
        onSubmit={save}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
