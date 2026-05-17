import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AmbientePreview, type AmbienteVisual } from "./AmbientePreview";
import { DEFAULT_EFFECTS, EFFECT_PRESETS, playHoverTap, type AmbienteEffects } from "@/lib/ambiente-effects";

export type AmbienteFormState = AmbienteVisual &
  AmbienteEffects & {
    slug: string;
    descricao: string;
    status: "ativo" | "inativo" | "rascunho" | "arquivado";
    tema: "claro" | "escuro" | "personalizado";
    favicon_url: string | null;
    imagem_login_url: string | null;
  };

export const DEFAULT_AMBIENTE: AmbienteFormState = {
  nome: "",
  slug: "",
  descricao: "",
  status: "rascunho",
  tema: "claro",
  logo_url: null,
  favicon_url: null,
  imagem_capa_url: null,
  imagem_login_url: null,
  cor_primaria: "#ED145B",
  cor_secundaria: "#1F2A44",
  cor_fundo: "#FFFFFF",
  cor_texto: "#1F2A44",
  cor_botao: "#ED145B",
  cor_card: "#FFFFFF",
  cor_borda: "#D0D3D4",
  card_estilo: "sombra",
  card_borda: "arredondado",
  card_tamanho: "medio",
  card_sombra: true,
  card_exibir_icone: true,
  card_exibir_imagem: true,
  ...DEFAULT_EFFECTS,
};

type Tab = "geral" | "identidade" | "cards" | "efeitos";

export function AmbienteForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
  extra,
}: {
  initial?: Partial<AmbienteFormState>;
  onSubmit: (state: AmbienteFormState) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  extra?: React.ReactNode;
}) {
  const [state, setState] = useState<AmbienteFormState>({ ...DEFAULT_AMBIENTE, ...initial });
  const [tab, setTab] = useState<Tab>("geral");

  function set<K extends keyof AmbienteFormState>(key: K, value: AmbienteFormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function slugify(v: string) {
    return v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(state);
        }}
        className="space-y-4"
      >
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border text-sm">
            {(["geral", "identidade", "cards", "efeitos"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-3 font-semibold capitalize transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t === "geral" ? "Dados gerais" : t === "identidade" ? "Identidade visual" : "Cards"}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {tab === "geral" && (
              <>
                <Field label="Nome *">
                  <Input
                    required
                    value={state.nome}
                    onChange={(e) => {
                      const nome = e.target.value;
                      setState((s) => ({
                        ...s,
                        nome,
                        slug: s.slug && s.slug !== slugify(s.nome) ? s.slug : slugify(nome),
                      }));
                    }}
                  />
                </Field>
                <Field label="Slug *" hint="Identificador único do ambiente. Usado em URLs.">
                  <Input
                    required
                    value={state.slug}
                    onChange={(e) => set("slug", slugify(e.target.value))}
                    placeholder="meu-ambiente"
                  />
                </Field>
                <Field label="Descrição">
                  <Textarea
                    rows={3}
                    value={state.descricao}
                    onChange={(e) => set("descricao", e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status">
                    <Select
                      value={state.status}
                      onChange={(v) => set("status", v as AmbienteFormState["status"])}
                      options={[
                        ["rascunho", "Rascunho"],
                        ["ativo", "Ativo"],
                        ["inativo", "Inativo"],
                        ["arquivado", "Arquivado"],
                      ]}
                    />
                  </Field>
                  <Field label="Tema">
                    <Select
                      value={state.tema}
                      onChange={(v) => set("tema", v as AmbienteFormState["tema"])}
                      options={[
                        ["claro", "Claro"],
                        ["escuro", "Escuro"],
                        ["personalizado", "Personalizado"],
                      ]}
                    />
                  </Field>
                </div>
              </>
            )}

            {tab === "identidade" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Logo (URL)">
                    <Input value={state.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value || null)} placeholder="https://…" />
                  </Field>
                  <Field label="Favicon (URL)">
                    <Input value={state.favicon_url ?? ""} onChange={(e) => set("favicon_url", e.target.value || null)} placeholder="https://…" />
                  </Field>
                  <Field label="Imagem de capa (URL)">
                    <Input value={state.imagem_capa_url ?? ""} onChange={(e) => set("imagem_capa_url", e.target.value || null)} placeholder="https://…" />
                  </Field>
                  <Field label="Imagem de login (URL)">
                    <Input value={state.imagem_login_url ?? ""} onChange={(e) => set("imagem_login_url", e.target.value || null)} placeholder="https://…" />
                  </Field>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Paleta</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ColorField label="Primária" value={state.cor_primaria} onChange={(v) => set("cor_primaria", v)} />
                    <ColorField label="Secundária" value={state.cor_secundaria} onChange={(v) => set("cor_secundaria", v)} />
                    <ColorField label="Botão" value={state.cor_botao} onChange={(v) => set("cor_botao", v)} />
                    <ColorField label="Fundo" value={state.cor_fundo} onChange={(v) => set("cor_fundo", v)} />
                    <ColorField label="Texto" value={state.cor_texto} onChange={(v) => set("cor_texto", v)} />
                    <ColorField label="Card" value={state.cor_card} onChange={(v) => set("cor_card", v)} />
                    <ColorField label="Borda" value={state.cor_borda} onChange={(v) => set("cor_borda", v)} />
                  </div>
                </div>
              </>
            )}

            {tab === "cards" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Estilo">
                    <Select
                      value={state.card_estilo}
                      onChange={(v) => set("card_estilo", v as AmbienteFormState["card_estilo"])}
                      options={[
                        ["flat", "Flat"],
                        ["sombra", "Sombra"],
                        ["borda", "Borda"],
                        ["imagem", "Imagem"],
                      ]}
                    />
                  </Field>
                  <Field label="Borda">
                    <Select
                      value={state.card_borda}
                      onChange={(v) => set("card_borda", v as AmbienteFormState["card_borda"])}
                      options={[
                        ["quadrado", "Quadrado"],
                        ["levemente_arredondado", "Levemente arredondado"],
                        ["arredondado", "Arredondado"],
                        ["pill", "Pill"],
                      ]}
                    />
                  </Field>
                  <Field label="Tamanho">
                    <Select
                      value={state.card_tamanho}
                      onChange={(v) => set("card_tamanho", v as AmbienteFormState["card_tamanho"])}
                      options={[
                        ["compacto", "Compacto"],
                        ["medio", "Médio"],
                        ["grande", "Grande"],
                      ]}
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Toggle label="Sombra" checked={state.card_sombra} onChange={(v) => set("card_sombra", v)} />
                  <Toggle label="Exibir ícone" checked={state.card_exibir_icone} onChange={(v) => set("card_exibir_icone", v)} />
                  <Toggle label="Exibir imagem" checked={state.card_exibir_imagem} onChange={(v) => set("card_exibir_imagem", v)} />
                </div>
              </>
            )}

            {tab === "efeitos" && (
              <>
                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
                    Presets
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(["nenhum", "sutil", "padrao", "imersivo"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, ...EFFECT_PRESETS[p] }))}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold capitalize hover:bg-muted"
                      >
                        {p === "padrao" ? "Padrão" : p}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Presets sobrescrevem todos os toggles abaixo. Você pode ajustar depois.
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
                    Hover nos cards
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <Toggle label="Tilt 3D (parallax)" checked={state.efeito_card_tilt_3d} onChange={(v) => set("efeito_card_tilt_3d", v)} />
                    <Toggle label="Glow / borda iluminada" checked={state.efeito_card_glow} onChange={(v) => set("efeito_card_glow", v)} />
                    <Toggle label="Scale-up suave" checked={state.efeito_card_scale} onChange={(v) => set("efeito_card_scale", v)} />
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
                    Outros efeitos visuais
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <Toggle label="Elevação dos botões" checked={state.efeito_botao_lift} onChange={(v) => set("efeito_botao_lift", v)} />
                    <Toggle label="Entrada animada (fade-in escalonado)" checked={state.efeito_entrada_animada} onChange={(v) => set("efeito_entrada_animada", v)} />
                    <Toggle label="Blobs animados no fundo" checked={state.efeito_blobs_fundo} onChange={(v) => set("efeito_blobs_fundo", v)} />
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-3">
                  <Label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                    Som ao passar o mouse
                  </Label>
                  <Toggle label="Som sintetizado no hover dos cards" checked={state.efeito_som_hover} onChange={(v) => set("efeito_som_hover", v)} />
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Volume {state.efeito_som_volume}%</Label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={state.efeito_som_volume}
                      onChange={(e) => set("efeito_som_volume", parseInt(e.target.value, 10))}
                      className="flex-1 accent-primary"
                    />
                    <button
                      type="button"
                      onClick={() => playHoverTap(state.efeito_som_volume)}
                      className="rounded-md border border-border px-3 py-1 text-xs font-semibold hover:bg-muted"
                    >
                      Testar
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Som gerado em tempo real (Web Audio) — sem arquivo. Funciona após primeira interação do usuário no browser.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando…" : submitLabel ?? "Salvar"}
          </Button>
        </div>

        {extra}
      </form>

      {/* Preview */}
      <div className="lg:sticky lg:top-6 self-start">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Preview da home do aluno
        </div>
        <AmbientePreview v={state} />
        <p className="mt-2 text-xs text-muted-foreground">
          Esta área é a única do admin onde o design segue a identidade do ambiente sendo editado.
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-secondary">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-secondary">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card p-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 bg-transparent text-xs font-mono outline-none"
        />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      <span className="text-secondary">{label}</span>
    </label>
  );
}
