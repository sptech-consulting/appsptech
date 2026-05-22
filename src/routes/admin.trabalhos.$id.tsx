import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowUp, ArrowDown, Plus, Trash2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

type ApresTipo = "video" | "pptx" | "imagem" | "documento" | "link";

type Trabalho = {
  id: string;
  ambiente_id: string;
  titulo: string;
  subtitulo: string | null;
  resumo: string | null;
  conteudo: string | null;
  autor_nome: string;
  turma: string | null;
  imagem_capa_url: string | null;
  apresentacao_tipo: ApresTipo | null;
  apresentacao_url: string | null;
  apresentacao_titulo: string | null;
  apresentacao_descricao: string | null;
  apresentacao_imagem_url: string | null;
  aplicacao_expectativa: string | null;
  link_externo: string | null;
  tags: string[] | null;
  status: "rascunho" | "publicada" | "arquivada";
  destaque: boolean;
  publicado_em: string | null;
  slug: string | null;
};

type Func = {
  id?: string;
  trabalho_id?: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  imagem_url: string | null;
  _new?: boolean;
};

type LinkItem = {
  id?: string;
  trabalho_id?: string;
  ordem: number;
  rotulo: string;
  url: string;
  icone_url: string | null;
  _new?: boolean;
};

type Ambiente = { id: string; nome: string; slug: string; codigo_acesso_resultados: string | null };

export const Route = createFileRoute("/admin/trabalhos/$id")({
  component: TrabalhoEditPage,
});

const NOVO_ID = "novo";

function TrabalhoEditPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch() as { ambiente?: string };
  const navigate = useNavigate();
  const isNovo = id === NOVO_ID;

  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [t, setT] = useState<Trabalho | null>(null);
  const [funcs, setFuncs] = useState<Func[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    const ambsP = supabase.from("ambientes").select("id,nome,slug,codigo_acesso_resultados").order("nome");
    if (isNovo) {
      const { data: ambs } = await ambsP;
      const ambientesList = (ambs ?? []) as Ambiente[];
      setAmbientes(ambientesList);
      const preselect = search.ambiente && ambientesList.find((a) => a.id === search.ambiente)?.id;
      setT({
        id: "",
        ambiente_id: preselect ?? ambientesList[0]?.id ?? "",
        titulo: "",
        subtitulo: null,
        resumo: null,
        conteudo: null,
        autor_nome: "",
        turma: null,
        imagem_capa_url: null,
        apresentacao_tipo: null,
        apresentacao_url: null,
        apresentacao_titulo: null,
        apresentacao_descricao: null,
        apresentacao_imagem_url: null,
        aplicacao_expectativa: null,
        link_externo: null,
        tags: null,
        status: "rascunho",
        destaque: false,
        publicado_em: null,
        slug: null,
      });
      setFuncs([]);
      setLinks([]);
      setLoading(false);
      return;
    }
    const tP = supabase.from("trabalhos" as any).select("*").eq("id", id).single();
    const fP = supabase
      .from("trabalho_funcionalidades" as any)
      .select("*")
      .eq("trabalho_id", id)
      .order("ordem");
    const lP = supabase
      .from("trabalho_links" as any)
      .select("*")
      .eq("trabalho_id", id)
      .order("ordem");
    const [{ data: ambs }, { data: tData, error }, { data: fData }, { data: lData }] = await Promise.all([
      ambsP,
      tP,
      fP,
      lP,
    ]);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setAmbientes((ambs ?? []) as Ambiente[]);
    setT(tData as unknown as Trabalho);
    setFuncs(((fData as unknown) as Func[]) ?? []);
    setLinks(((lData as unknown) as LinkItem[]) ?? []);
    setLoading(false);
  }

  function patch<K extends keyof Trabalho>(k: K, v: Trabalho[K]) {
    setT((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function salvar(novoStatus?: Trabalho["status"]) {
    if (!t) return;
    if (!t.ambiente_id) return toast.error("Selecione um ambiente.");
    if (!t.titulo.trim()) return toast.error("Informe o título.");
    if (!t.autor_nome.trim()) return toast.error("Informe o(s) autor(es).");
    const statusFinal = novoStatus ?? t.status;
    if (novoStatus) patch("status", novoStatus);
    setSaving(true);
    const payload = {
      ambiente_id: t.ambiente_id,
      titulo: t.titulo.trim(),
      subtitulo: t.subtitulo || null,
      resumo: t.resumo || null,
      conteudo: t.conteudo || null,
      autor_nome: t.autor_nome.trim(),
      turma: t.turma || null,
      imagem_capa_url: t.imagem_capa_url || null,
      apresentacao_tipo: t.apresentacao_tipo,
      apresentacao_url: t.apresentacao_url || null,
      apresentacao_titulo: t.apresentacao_titulo || null,
      apresentacao_descricao: t.apresentacao_descricao || null,
      apresentacao_imagem_url: t.apresentacao_imagem_url || null,
      aplicacao_expectativa: t.aplicacao_expectativa || null,
      link_externo: t.link_externo || null,
      status: statusFinal,
      destaque: t.destaque,
      publicado_em:
        statusFinal === "publicada" ? t.publicado_em ?? new Date().toISOString() : null,
    };
    const sb: any = supabase;
    let trabalhoId = t.id;
    if (isNovo) {
      const { data, error } = await sb.from("trabalhos").insert(payload).select("id").single();
      if (error) {
        setSaving(false);
        return toast.error(error.message);
      }
      trabalhoId = data.id as string;
    } else {
      const { error } = await sb.from("trabalhos").update(payload).eq("id", t.id);
      if (error) {
        setSaving(false);
        return toast.error(error.message);
      }
    }

    // Salvar funcionalidades
    const funcsValid = funcs.filter((f) => f.titulo.trim());
    for (let i = 0; i < funcsValid.length; i++) {
      const f = funcsValid[i];
      const row = {
        trabalho_id: trabalhoId,
        ordem: i,
        titulo: f.titulo.trim(),
        descricao: f.descricao || null,
        imagem_url: f.imagem_url || null,
      };
      if (f.id && !f._new) {
        await sb.from("trabalho_funcionalidades").update(row).eq("id", f.id);
      } else {
        await sb.from("trabalho_funcionalidades").insert(row);
      }
    }

    // Salvar links
    const linksValid = links.filter((l) => l.rotulo.trim() && l.url.trim());
    for (let i = 0; i < linksValid.length; i++) {
      const l = linksValid[i];
      const row = {
        trabalho_id: trabalhoId,
        ordem: i,
        rotulo: l.rotulo.trim(),
        url: l.url.trim(),
        icone_url: l.icone_url || null,
      };
      if (l.id && !l._new) {
        await sb.from("trabalho_links").update(row).eq("id", l.id);
      } else {
        await sb.from("trabalho_links").insert(row);
      }
    }

    setSaving(false);
    toast.success(isNovo ? "Trabalho criado." : "Trabalho atualizado.");
    if (isNovo) {
      void navigate({ to: "/admin/trabalhos/$id", params: { id: trabalhoId } });
    } else {
      void load();
    }
  }

  async function arquivar() {
    if (!t || isNovo) return;
    if (!confirm("Arquivar este trabalho? Ele deixará de aparecer no mural.")) return;
    const sb: any = supabase;
    const { error } = await sb.from("trabalhos").update({ status: "arquivada" }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Trabalho arquivado.");
    void navigate({ to: "/admin/trabalhos" });
  }

  if (loading || !t) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  const ambienteAtual = ambientes.find((a) => a.id === t.ambiente_id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title={isNovo ? "Novo trabalho" : t.titulo || "Trabalho"}
        description="Cadastro completo de trabalho para o Mural de Resultados."
        crumbs={[
          { label: "Ambientes", to: "/admin/ambientes" },
          ...(ambienteAtual ? [{ label: ambienteAtual.nome, to: `/admin/ambientes/${ambienteAtual.id}` }] : []),
          { label: "Trabalhos", to: "/admin/trabalhos" },
          { label: isNovo ? "Novo" : t.titulo },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/trabalhos" })}>
              Voltar
            </Button>
            {!isNovo && (
              <Button variant="outline" onClick={arquivar}>
                <Trash2 className="h-4 w-4" /> Arquivar
              </Button>
            )}
            <Button variant="outline" onClick={() => salvar()} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar rascunho"}
            </Button>
            <Button onClick={() => salvar("publicada")} disabled={saving}>
              {t.status === "publicada" ? "Salvar e manter publicado" : "Publicar"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Identificação */}
        <Section title="Identificação">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ambiente" required>
              <select
                value={t.ambiente_id}
                onChange={(e) => patch("ambiente_id", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              >
                <option value="">Selecione…</option>
                {ambientes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={t.status}
                onChange={(e) => patch("status", e.target.value as Trabalho["status"])}
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              >
                <option value="rascunho">Rascunho</option>
                <option value="publicada">Publicada</option>
                <option value="arquivada">Arquivada</option>
              </select>
            </Field>
            <Field label="Título" required>
              <Input value={t.titulo} onChange={(e) => patch("titulo", e.target.value)} />
            </Field>
            <Field label="Subtítulo" helper='Ex.: "Truth Layer + Revenue Command Center"'>
              <Input value={t.subtitulo ?? ""} onChange={(e) => patch("subtitulo", e.target.value || null)} />
            </Field>
            <Field label="Autor(es)" required>
              <Input value={t.autor_nome} onChange={(e) => patch("autor_nome", e.target.value)} />
            </Field>
            <Field label="Turma">
              <Input value={t.turma ?? ""} onChange={(e) => patch("turma", e.target.value || null)} />
            </Field>
            <Field label="Resumo (para o card)" full>
              <Textarea
                rows={3}
                value={t.resumo ?? ""}
                onChange={(e) => patch("resumo", e.target.value || null)}
              />
            </Field>
            <Field label="Descrição completa" full helper="Aparece no topo da página de detalhe, abaixo do título.">
              <Textarea
                rows={5}
                value={t.conteudo ?? ""}
                onChange={(e) => patch("conteudo", e.target.value || null)}
              />
            </Field>
            <Field label="Imagem principal (capa do card)" full>
              <ImageUpload
                value={t.imagem_capa_url}
                onChange={(url) => patch("imagem_capa_url", url)}
                folder="trabalhos/capas"
                aspect="aspect-square"
              />
            </Field>
          </div>
        </Section>

        {/* Apresentação */}
        <Section title="Apresentação" description="Vídeo, slide, imagem ou documento que abre a página de detalhe.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de apresentação">
              <select
                value={t.apresentacao_tipo ?? ""}
                onChange={(e) =>
                  patch("apresentacao_tipo", (e.target.value || null) as ApresTipo | null)
                }
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              >
                <option value="">Nenhum</option>
                <option value="video">Vídeo (YouTube/Vimeo)</option>
                <option value="imagem">Imagem</option>
                <option value="pptx">Apresentação (PPTX)</option>
                <option value="documento">Documento (PDF/Doc)</option>
                <option value="link">Link externo</option>
              </select>
            </Field>
            <Field label="Título da apresentação">
              <Input
                value={t.apresentacao_titulo ?? ""}
                onChange={(e) => patch("apresentacao_titulo", e.target.value || null)}
                placeholder='Ex.: "Apresentação"'
              />
            </Field>
            <Field
              label={t.apresentacao_tipo === "video" ? "URL do vídeo" : "URL do arquivo / link"}
              full
              helper={t.apresentacao_tipo === "video" ? "Aceita YouTube e Vimeo." : "Cole o link público do arquivo ou destino."}
            >
              <Input
                value={t.apresentacao_url ?? ""}
                onChange={(e) => patch("apresentacao_url", e.target.value || null)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Descrição da apresentação" full>
              <Textarea
                rows={3}
                value={t.apresentacao_descricao ?? ""}
                onChange={(e) => patch("apresentacao_descricao", e.target.value || null)}
              />
            </Field>
            <Field
              label="Imagem da apresentação (hero da página)"
              full
              helper="Imagem grande exibida no topo da página de detalhe. Recomendado para todos os tipos exceto vídeo."
            >
              <ImageUpload
                value={t.apresentacao_imagem_url}
                onChange={(url) => patch("apresentacao_imagem_url", url)}
                folder="trabalhos/apresentacao"
                aspect="aspect-video"
              />
            </Field>
          </div>
        </Section>

        {/* Funcionalidades */}
        <Section
          title="Principais funcionalidades"
          description="Blocos com título, descrição e imagem. Renderizados em zigzag na página de detalhe."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setFuncs((arr) => [
                  ...arr,
                  { ordem: arr.length, titulo: "", descricao: null, imagem_url: null, _new: true },
                ])
              }
            >
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
          }
        >
          {funcs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma funcionalidade adicionada.</p>
          ) : (
            <div className="space-y-3">
              {funcs.map((f, i) => (
                <div key={f.id ?? `n-${i}`} className="rounded-lg border border-border p-3 bg-muted/30">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Funcionalidade {i + 1}
                    </span>
                    <div className="flex gap-1">
                      <IconBtn disabled={i === 0} onClick={() => move(funcs, setFuncs, i, -1)} title="Subir">
                        <ArrowUp className="h-3 w-3" />
                      </IconBtn>
                      <IconBtn
                        disabled={i === funcs.length - 1}
                        onClick={() => move(funcs, setFuncs, i, 1)}
                        title="Descer"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </IconBtn>
                      <IconBtn
                        onClick={async () => {
                          if (f.id && !f._new) {
                            const sb: any = supabase;
                            await sb.from("trabalho_funcionalidades").delete().eq("id", f.id);
                          }
                          setFuncs((arr) => arr.filter((_, idx) => idx !== i));
                        }}
                        title="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconBtn>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Título">
                      <Input
                        value={f.titulo}
                        onChange={(e) => updateAt(funcs, setFuncs, i, { titulo: e.target.value })}
                      />
                    </Field>
                    <Field label="Imagem">
                      <ImageUpload
                        value={f.imagem_url}
                        onChange={(url) => updateAt(funcs, setFuncs, i, { imagem_url: url })}
                        folder="trabalhos/funcionalidades"
                        aspect="aspect-video"
                      />
                    </Field>
                    <Field label="Descrição" full>
                      <Textarea
                        rows={3}
                        value={f.descricao ?? ""}
                        onChange={(e) =>
                          updateAt(funcs, setFuncs, i, { descricao: e.target.value || null })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Aplicação */}
        <Section title="Onde se aplica e expectativa">
          <Textarea
            rows={6}
            value={t.aplicacao_expectativa ?? ""}
            onChange={(e) => patch("aplicacao_expectativa", e.target.value || null)}
            placeholder="Onde a solução se aplica, expectativa de impacto, etc."
          />
        </Section>

        {/* Links úteis */}
        <Section
          title="Links úteis"
          description="Aparecem como pílulas no rodapé da página de detalhe."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setLinks((arr) => [
                  ...arr,
                  { ordem: arr.length, rotulo: "", url: "", icone_url: null, _new: true },
                ])
              }
            >
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
          }
        >
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum link adicionado.</p>
          ) : (
            <div className="space-y-2">
              {links.map((l, i) => (
                <div
                  key={l.id ?? `n-${i}`}
                  className="grid gap-2 items-end rounded-lg border border-border p-3 bg-muted/30 sm:grid-cols-[1fr_2fr_auto]"
                >
                  <Field label="Rótulo">
                    <Input
                      value={l.rotulo}
                      onChange={(e) => updateAt(links, setLinks, i, { rotulo: e.target.value })}
                    />
                  </Field>
                  <Field label="URL">
                    <Input
                      value={l.url}
                      onChange={(e) => updateAt(links, setLinks, i, { url: e.target.value })}
                      placeholder="https://…"
                    />
                  </Field>
                  <div className="flex gap-1 pb-1">
                    <IconBtn disabled={i === 0} onClick={() => move(links, setLinks, i, -1)} title="Subir">
                      <ArrowUp className="h-3 w-3" />
                    </IconBtn>
                    <IconBtn
                      disabled={i === links.length - 1}
                      onClick={() => move(links, setLinks, i, 1)}
                      title="Descer"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </IconBtn>
                    <IconBtn
                      onClick={async () => {
                        if (l.id && !l._new) {
                          const sb: any = supabase;
                          await sb.from("trabalho_links").delete().eq("id", l.id);
                        }
                        setLinks((arr) => arr.filter((_, idx) => idx !== i));
                      }}
                      title="Remover"
                    >
                      <Trash2 className="h-3 w-3" />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Visualizar */}
        {!isNovo && ambienteAtual && (
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">Pré-visualizar no mural</div>
              <div className="text-xs text-muted-foreground">
                {ambienteAtual.codigo_acesso_resultados
                  ? "Abre em nova aba já autenticado com o código do ambiente."
                  : "Defina um código de acesso aos Resultados no ambiente para visualizar."}
              </div>
            </div>
            {ambienteAtual.codigo_acesso_resultados ? (
              <a
                href={`/e/${ambienteAtual.slug}/resultados/${t.slug ?? t.id}?codigo=${encodeURIComponent(ambienteAtual.codigo_acesso_resultados)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <ExternalLink className="h-3 w-3" /> Abrir
              </a>
            ) : (
              <Link
                to="/admin/ambientes/$id"
                params={{ id: ambienteAtual.id }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Configurar código
              </Link>
            )}
          </div>
        )}

        {/* Barra de ações inferior */}
        <div className="sticky bottom-4 z-10 rounded-xl border border-border bg-card/95 backdrop-blur p-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="text-xs text-muted-foreground">
            Status atual: <strong className="text-secondary">{t.status}</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/trabalhos" })}>
              Voltar
            </Button>
            <Button variant="outline" onClick={() => salvar()} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar rascunho"}
            </Button>
            <Button onClick={() => salvar("publicada")} disabled={saving}>
              {t.status === "publicada" ? "Salvar e manter publicado" : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-secondary">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  required,
  full,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  full?: boolean;
  helper?: string;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-semibold text-secondary">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
      {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-secondary hover:bg-muted disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function updateAt<T>(arr: T[], setArr: (next: T[]) => void, i: number, patch: Partial<T>) {
  setArr(arr.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
}

function move<T>(arr: T[], setArr: (next: T[]) => void, i: number, delta: number) {
  const j = i + delta;
  if (j < 0 || j >= arr.length) return;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  setArr(next);
}
