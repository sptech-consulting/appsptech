import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, X, ChevronUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/admin/ferramentas/$id")({
  component: FerramentaDetalhePage,
});

type Ferramenta = {
  id: string;
  nome: string;
  descricao: string | null;
  subtitulo: string | null;
  descricao_longa: string | null;
  url: string | null;
  icone_url: string | null;
  imagem_capa_url: string | null;
  categoria: string | null;
  tipo_abertura: "nova_aba" | "mesma_aba" | "modal";
  frase_destaque: string | null;
  status: "ativo" | "inativo";
};

type CasoUso = { id: string; texto: string; ordem: number };
type Tag = { id: string; tipo: "input" | "output" | "integracao"; rotulo: string; ordem: number };
type Bloco = { id: string; titulo: string; conteudo: string; ordem: number };
type Funcionalidade = { id: string; titulo: string; descricao: string | null; imagem_url: string | null; ordem: number };
type CasoTeste = { id: string; titulo: string; badge: string | null; prompt_exemplo: string | null; explicacao: string | null; ordem: number };

type TabKey = "geral" | "ambientes" | "casos_uso" | "tags" | "blocos" | "funcionalidades" | "casos_teste";

const TABS: { key: TabKey; label: string }[] = [
  { key: "geral", label: "Geral" },
  { key: "ambientes", label: "Ambientes" },
  { key: "casos_uso", label: "Casos de uso" },
  { key: "tags", label: "Tags" },
  { key: "blocos", label: "Blocos" },
  { key: "funcionalidades", label: "Funcionalidades" },
  { key: "casos_teste", label: "Casos de teste" },
];

function FerramentaDetalhePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("geral");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Ferramenta | null>(null);
  const [casosUso, setCasosUso] = useState<CasoUso[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [funcs, setFuncs] = useState<Funcionalidade[]>([]);
  const [casosTeste, setCasosTeste] = useState<CasoTeste[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [fr, cu, tg, bl, fn, ct] = await Promise.all([
      supabase.from("ferramentas").select("*").eq("id", id).single(),
      supabase.from("ferramenta_casos_uso").select("*").eq("ferramenta_id", id).order("ordem"),
      supabase.from("ferramenta_tags").select("*").eq("ferramenta_id", id).order("ordem"),
      supabase.from("ferramenta_blocos").select("*").eq("ferramenta_id", id).order("ordem"),
      supabase.from("ferramenta_funcionalidades").select("*").eq("ferramenta_id", id).order("ordem"),
      supabase.from("ferramenta_casos_teste").select("*").eq("ferramenta_id", id).order("ordem"),
    ]);
    if (fr.error) toast.error(fr.error.message);
    setF((fr.data as Ferramenta) ?? null);
    setCasosUso((cu.data as CasoUso[]) ?? []);
    setTags((tg.data as Tag[]) ?? []);
    setBlocos((bl.data as Bloco[]) ?? []);
    setFuncs((fn.data as Funcionalidade[]) ?? []);
    setCasosTeste((ct.data as CasoTeste[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveGeral() {
    if (!f) return;
    setSaving(true);
    const { error } = await supabase
      .from("ferramentas")
      .update({
        nome: f.nome,
        descricao: f.descricao || null,
        subtitulo: f.subtitulo || null,
        descricao_longa: f.descricao_longa || null,
        url: f.url || null,
        icone_url: f.icone_url || null,
        imagem_capa_url: f.imagem_capa_url || null,
        categoria: f.categoria || null,
        tipo_abertura: f.tipo_abertura,
        frase_destaque: f.frase_destaque || null,
        status: f.status,
      })
      .eq("id", f.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Ferramenta salva.");
  }

  if (loading || !f) {
    return <div className="p-8 text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <Link
        to="/admin/ferramentas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para ferramentas
      </Link>

      <PageHeader
        title={f.nome || "Nova ferramenta"}
        description="Edite os dados gerais e os blocos da página de detalhe."
      />

      <div className="flex flex-wrap gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ${
              tab === t.key
                ? "bg-card text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <GeralTab f={f} setF={setF} saving={saving} onSave={saveGeral} />
      )}

      {tab === "casos_uso" && (
        <CasosUsoTab ferramentaId={f.id} items={casosUso} setItems={setCasosUso} reload={load} />
      )}

      {tab === "tags" && (
        <TagsTab ferramentaId={f.id} items={tags} setItems={setTags} reload={load} />
      )}

      {tab === "blocos" && (
        <BlocosTab ferramentaId={f.id} items={blocos} setItems={setBlocos} reload={load} />
      )}

      {tab === "funcionalidades" && (
        <FuncsTab ferramentaId={f.id} items={funcs} setItems={setFuncs} reload={load} />
      )}

      {tab === "casos_teste" && (
        <CasosTesteTab ferramentaId={f.id} items={casosTeste} setItems={setCasosTeste} reload={load} />
      )}
    </div>
  );
}

/* ---------- GERAL ---------- */
function GeralTab({
  f,
  setF,
  saving,
  onSave,
}: {
  f: Ferramenta;
  setF: (f: Ferramenta) => void;
  saving: boolean;
  onSave: () => void;
}) {
  function up<K extends keyof Ferramenta>(k: K, v: Ferramenta[K]) {
    setF({ ...f, [k]: v });
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome *">
          <input
            value={f.nome ?? ""}
            onChange={(e) => up("nome", e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Categoria">
          <input
            value={f.categoria ?? ""}
            onChange={(e) => up("categoria", e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Subtítulo (curto, aparece no header)">
          <input
            value={f.subtitulo ?? ""}
            onChange={(e) => up("subtitulo", e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            placeholder="Ex.: Conheça o Gemini, o seu assistente de IA no workspace Google"
          />
        </Field>
        <Field label="URL externa">
          <input
            value={f.url ?? ""}
            onChange={(e) => up("url", e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            placeholder="https://…"
          />
        </Field>
        <Field label="Descrição curta (card na home)">
          <textarea
            value={f.descricao ?? ""}
            onChange={(e) => up("descricao", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Descrição longa (página de detalhe)">
          <textarea
            value={f.descricao_longa ?? ""}
            onChange={(e) => up("descricao_longa", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Frase de destaque (banner)">
          <input
            value={f.frase_destaque ?? ""}
            onChange={(e) => up("frase_destaque", e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            placeholder="Ex.: O MODELO MAIS INTELIGENTE DO GOOGLE ATÉ HOJE"
          />
        </Field>
        <Field label="Abertura do link">
          <select
            value={f.tipo_abertura}
            onChange={(e) => up("tipo_abertura", e.target.value as Ferramenta["tipo_abertura"])}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="nova_aba">Nova aba</option>
            <option value="mesma_aba">Mesma aba</option>
            <option value="modal">Modal</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            value={f.status}
            onChange={(e) => up("status", e.target.value as Ferramenta["status"])}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Ícone (quadrado)">
          <ImageUpload
            value={f.icone_url}
            onChange={(url) => up("icone_url", url)}
            folder="ferramentas/icones"
            aspect="aspect-square"
          />
        </Field>
        <Field label="Imagem de capa (hero da página de detalhe)">
          <ImageUpload
            value={f.imagem_capa_url}
            onChange={(url) => up("imagem_capa_url", url)}
            folder="ferramentas/capas"
            aspect="aspect-video"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- CASOS DE USO ---------- */
function CasosUsoTab({
  ferramentaId,
  items,
  setItems,
  reload,
}: {
  ferramentaId: string;
  items: CasoUso[];
  setItems: (items: CasoUso[]) => void;
  reload: () => Promise<void>;
}) {
  const [novo, setNovo] = useState("");

  async function add() {
    if (!novo.trim()) return;
    const { error } = await supabase
      .from("ferramenta_casos_uso")
      .insert({ ferramenta_id: ferramentaId, texto: novo.trim(), ordem: items.length });
    if (error) return toast.error(error.message);
    setNovo("");
    await reload();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("ferramenta_casos_uso").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  }
  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= items.length) return;
    const a = items[idx], b = items[swap];
    await Promise.all([
      supabase.from("ferramenta_casos_uso").update({ ordem: b.ordem }).eq("id", a.id),
      supabase.from("ferramenta_casos_uso").update({ ordem: a.ordem }).eq("id", b.id),
    ]);
    await reload();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Lista de bullets que aparece no card "Casos de Uso".</p>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <div className="flex flex-col">
              <button onClick={() => void move(it.id, -1)} className="text-muted-foreground hover:text-secondary"><ChevronUp className="h-3 w-3" /></button>
              <button onClick={() => void move(it.id, 1)} className="text-muted-foreground hover:text-secondary"><ChevronDown className="h-3 w-3" /></button>
            </div>
            <span className="flex-1 text-sm">{it.texto}</span>
            <button onClick={() => void remove(it.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void add()}
          placeholder="Novo caso de uso"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <Button onClick={() => void add()}><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>
    </div>
  );
}

/* ---------- TAGS (input / output / integração) ---------- */
function TagsTab({
  ferramentaId,
  items,
  setItems,
  reload,
}: {
  ferramentaId: string;
  items: Tag[];
  setItems: (items: Tag[]) => void;
  reload: () => Promise<void>;
}) {
  const grupos: { tipo: Tag["tipo"]; titulo: string }[] = [
    { tipo: "input", titulo: "Formas de Input" },
    { tipo: "output", titulo: "Formas de Output" },
    { tipo: "integracao", titulo: "Integrações" },
  ];

  async function add(tipo: Tag["tipo"], rotulo: string) {
    if (!rotulo.trim()) return;
    const ordem = items.filter((t) => t.tipo === tipo).length;
    const { error } = await supabase
      .from("ferramenta_tags")
      .insert({ ferramenta_id: ferramentaId, tipo, rotulo: rotulo.trim(), ordem });
    if (error) return toast.error(error.message);
    await reload();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("ferramenta_tags").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      {grupos.map((g) => (
        <GrupoTags
          key={g.tipo}
          titulo={g.titulo}
          tipo={g.tipo}
          tags={items.filter((t) => t.tipo === g.tipo)}
          onAdd={(r) => void add(g.tipo, r)}
          onRemove={(id) => void remove(id)}
        />
      ))}
    </div>
  );
}

function GrupoTags({
  titulo,
  tags,
  onAdd,
  onRemove,
}: {
  titulo: string;
  tipo: Tag["tipo"];
  tags: Tag[];
  onAdd: (rotulo: string) => void;
  onRemove: (id: string) => void;
}) {
  const [novo, setNovo] = useState("");
  function commit() {
    if (!novo.trim()) return;
    onAdd(novo.trim());
    setNovo("");
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-secondary mb-3">{titulo}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.length === 0 && <span className="text-xs text-muted-foreground">Sem tags ainda.</span>}
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1"
          >
            {t.rotulo}
            <button onClick={() => onRemove(t.id)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder="Nova tag"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <Button size="sm" onClick={commit}><Plus className="h-3 w-3" /> Adicionar</Button>
      </div>
    </div>
  );
}

/* ---------- BLOCOS ---------- */
function BlocosTab({
  ferramentaId,
  items,
  setItems,
  reload,
}: {
  ferramentaId: string;
  items: Bloco[];
  setItems: (items: Bloco[]) => void;
  reload: () => Promise<void>;
}) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  async function add() {
    if (!titulo.trim() || !conteudo.trim()) return;
    const { error } = await supabase
      .from("ferramenta_blocos")
      .insert({ ferramenta_id: ferramentaId, titulo: titulo.trim(), conteudo: conteudo.trim(), ordem: items.length });
    if (error) return toast.error(error.message);
    setTitulo("");
    setConteudo("");
    await reload();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("ferramenta_blocos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  }
  async function update(id: string, patch: Partial<Bloco>) {
    const { error } = await supabase.from("ferramenta_blocos").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Blocos de texto destacados (título curto + parágrafo). Ex.: "Multimodal Nativa".</p>
      {items.map((b) => (
        <div key={b.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
          <input
            value={b.titulo}
            onChange={(e) => setItems(items.map((i) => (i.id === b.id ? { ...i, titulo: e.target.value } : i)))}
            onBlur={(e) => void update(b.id, { titulo: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
          />
          <textarea
            value={b.conteudo}
            onChange={(e) => setItems(items.map((i) => (i.id === b.id ? { ...i, conteudo: e.target.value } : i)))}
            onBlur={(e) => void update(b.id, { conteudo: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <button onClick={() => void remove(b.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do bloco"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold"
        />
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Conteúdo do bloco"
          rows={3}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={() => void add()}><Plus className="h-3 w-3" /> Adicionar bloco</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- FUNCIONALIDADES ---------- */
function FuncsTab({
  ferramentaId,
  items,
  setItems,
  reload,
}: {
  ferramentaId: string;
  items: Funcionalidade[];
  setItems: (items: Funcionalidade[]) => void;
  reload: () => Promise<void>;
}) {
  async function add() {
    const { error } = await supabase
      .from("ferramenta_funcionalidades")
      .insert({ ferramenta_id: ferramentaId, titulo: "Nova funcionalidade", descricao: null, imagem_url: null, ordem: items.length });
    if (error) return toast.error(error.message);
    await reload();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("ferramenta_funcionalidades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  }
  async function update(id: string, patch: Partial<Funcionalidade>) {
    const { error } = await supabase.from("ferramenta_funcionalidades").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Lista expansível à esquerda + imagem preview à direita na página de detalhe.</p>
      {items.map((it) => (
        <div key={it.id} className="rounded-lg border border-border bg-card p-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <input
              value={it.titulo}
              onChange={(e) => setItems(items.map((i) => (i.id === it.id ? { ...i, titulo: e.target.value } : i)))}
              onBlur={(e) => void update(it.id, { titulo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
            />
            <textarea
              value={it.descricao ?? ""}
              onChange={(e) => setItems(items.map((i) => (i.id === it.id ? { ...i, descricao: e.target.value } : i)))}
              onBlur={(e) => void update(it.id, { descricao: e.target.value || null })}
              rows={4}
              placeholder="Descrição da funcionalidade"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button onClick={() => void remove(it.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>
          <ImageUpload
            value={it.imagem_url}
            onChange={(url) => void update(it.id, { imagem_url: url })}
            folder="ferramentas/funcionalidades"
            aspect="aspect-video"
          />
        </div>
      ))}
      <Button onClick={() => void add()}><Plus className="h-4 w-4" /> Adicionar funcionalidade</Button>
    </div>
  );
}

/* ---------- CASOS DE TESTE ---------- */
function CasosTesteTab({
  ferramentaId,
  items,
  setItems,
  reload,
}: {
  ferramentaId: string;
  items: CasoTeste[];
  setItems: (items: CasoTeste[]) => void;
  reload: () => Promise<void>;
}) {
  async function add() {
    const { error } = await supabase
      .from("ferramenta_casos_teste")
      .insert({ ferramenta_id: ferramentaId, titulo: "Novo caso", badge: "PROMPT INADEQUADO", prompt_exemplo: "", explicacao: "", ordem: items.length });
    if (error) return toast.error(error.message);
    await reload();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("ferramenta_casos_teste").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  }
  async function update(id: string, patch: Partial<CasoTeste>) {
    const { error } = await supabase.from("ferramenta_casos_teste").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Carrossel de cards com exemplos de prompts e explicações.</p>
      {items.map((it) => (
        <div key={it.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <input
              value={it.titulo}
              onChange={(e) => setItems(items.map((i) => (i.id === it.id ? { ...i, titulo: e.target.value } : i)))}
              onBlur={(e) => void update(it.id, { titulo: e.target.value })}
              placeholder="Título"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
            />
            <input
              value={it.badge ?? ""}
              onChange={(e) => setItems(items.map((i) => (i.id === it.id ? { ...i, badge: e.target.value } : i)))}
              onBlur={(e) => void update(it.id, { badge: e.target.value || null })}
              placeholder="Badge (ex.: PROMPT INADEQUADO)"
              className="rounded-md border border-border bg-background px-3 py-2 text-xs uppercase"
            />
          </div>
          <textarea
            value={it.prompt_exemplo ?? ""}
            onChange={(e) => setItems(items.map((i) => (i.id === it.id ? { ...i, prompt_exemplo: e.target.value } : i)))}
            onBlur={(e) => void update(it.id, { prompt_exemplo: e.target.value || null })}
            rows={2}
            placeholder="Exemplo de prompt"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={it.explicacao ?? ""}
            onChange={(e) => setItems(items.map((i) => (i.id === it.id ? { ...i, explicacao: e.target.value } : i)))}
            onBlur={(e) => void update(it.id, { explicacao: e.target.value || null })}
            rows={3}
            placeholder="Explicação do porquê / como melhorar"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <button onClick={() => void remove(it.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Remover
            </button>
          </div>
        </div>
      ))}
      <Button onClick={() => void add()}><Plus className="h-4 w-4" /> Adicionar caso de teste</Button>
    </div>
  );
}

/* ---------- Helpers ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
