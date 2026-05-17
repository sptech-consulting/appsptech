import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { AmbienteForm, type AmbienteFormState, DEFAULT_AMBIENTE } from "@/components/AmbienteForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/ambientes/$id")({
  component: EditAmbiente,
});

type Linkable = { id: string; nome?: string; titulo?: string };

function EditAmbiente() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<AmbienteFormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("ambientes").select("*").eq("id", id).single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setInitial({
        ...DEFAULT_AMBIENTE,
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao ?? "",
        status: data.status,
        tema: data.tema,
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        imagem_capa_url: data.imagem_capa_url,
        imagem_login_url: data.imagem_login_url,
        codigo_acesso_resultados: (data as any).codigo_acesso_resultados ?? null,
        cor_primaria: data.cor_primaria ?? DEFAULT_AMBIENTE.cor_primaria,
        cor_secundaria: data.cor_secundaria ?? DEFAULT_AMBIENTE.cor_secundaria,
        cor_fundo: data.cor_fundo ?? DEFAULT_AMBIENTE.cor_fundo,
        cor_texto: data.cor_texto ?? DEFAULT_AMBIENTE.cor_texto,
        cor_botao: data.cor_botao ?? DEFAULT_AMBIENTE.cor_botao,
        cor_card: data.cor_card ?? DEFAULT_AMBIENTE.cor_card,
        cor_borda: data.cor_borda ?? DEFAULT_AMBIENTE.cor_borda,
        card_estilo: data.card_estilo ?? DEFAULT_AMBIENTE.card_estilo,
        card_borda: data.card_borda ?? DEFAULT_AMBIENTE.card_borda,
        card_tamanho: data.card_tamanho ?? DEFAULT_AMBIENTE.card_tamanho,
        card_sombra: data.card_sombra ?? true,
        card_exibir_icone: data.card_exibir_icone ?? true,
        card_exibir_imagem: data.card_exibir_imagem ?? true,
        efeito_card_tilt_3d: (data as any).efeito_card_tilt_3d ?? false,
        efeito_card_glow: (data as any).efeito_card_glow ?? false,
        efeito_card_scale: (data as any).efeito_card_scale ?? false,
        efeito_botao_lift: (data as any).efeito_botao_lift ?? false,
        efeito_entrada_animada: (data as any).efeito_entrada_animada ?? false,
        efeito_som_hover: (data as any).efeito_som_hover ?? false,
        efeito_som_volume: (data as any).efeito_som_volume ?? 40,
        efeito_blobs_fundo: (data as any).efeito_blobs_fundo ?? false,
      });
    })();
  }, [id]);

  async function handleSave(state: AmbienteFormState) {
    setSaving(true);
    const { error } = await supabase
      .from("ambientes")
      .update({
        nome: state.nome,
        slug: state.slug,
        descricao: state.descricao || null,
        status: state.status,
        tema: state.tema,
        logo_url: state.logo_url,
        favicon_url: state.favicon_url,
        imagem_capa_url: state.imagem_capa_url,
        imagem_login_url: state.imagem_login_url,
        codigo_acesso_resultados: state.codigo_acesso_resultados || null,
        cor_primaria: state.cor_primaria,
        cor_secundaria: state.cor_secundaria,
        cor_fundo: state.cor_fundo,
        cor_texto: state.cor_texto,
        cor_botao: state.cor_botao,
        cor_card: state.cor_card,
        cor_borda: state.cor_borda,
        card_estilo: state.card_estilo,
        card_borda: state.card_borda,
        card_tamanho: state.card_tamanho,
        card_sombra: state.card_sombra,
        card_exibir_icone: state.card_exibir_icone,
        card_exibir_imagem: state.card_exibir_imagem,
        efeito_card_tilt_3d: state.efeito_card_tilt_3d,
        efeito_card_glow: state.efeito_card_glow,
        efeito_card_scale: state.efeito_card_scale,
        efeito_botao_lift: state.efeito_botao_lift,
        efeito_entrada_animada: state.efeito_entrada_animada,
        efeito_som_hover: state.efeito_som_hover,
        efeito_som_volume: state.efeito_som_volume,
        efeito_blobs_fundo: state.efeito_blobs_fundo,
      } as any)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ambiente atualizado.");
  }

  if (!initial) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      <PageHeader
        title={initial.nome || "Ambiente"}
        description="Edição completa do ambiente, com preview ao vivo e gestão de vínculos."
        crumbs={[{ label: "Ambientes", to: "/admin/ambientes" }, { label: initial.nome }]}
        actions={
          <Button variant="outline" onClick={() => void navigate({ to: "/admin/ambientes" })}>
            Voltar
          </Button>
        }
      />
      <AccessLinkCard slug={initial.slug} />
      <AmbienteForm
        initial={initial}
        onSubmit={handleSave}
        submitting={saving}
        submitLabel="Salvar alterações"
        extra={<VinculosManager ambienteId={id} />}
      />
    </div>
  );
}

function AccessLinkCard({ slug }: { slug: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/e/${slug}/login` : `/e/${slug}/login`;
  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <Link2 className="h-4 w-4 text-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-secondary uppercase tracking-widest">Link de acesso do aluno</div>
        <code className="block truncate text-xs text-muted-foreground">{url}</code>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void navigator.clipboard.writeText(url);
          toast.success("Link copiado");
        }}
      >
        <Link2 className="h-3 w-3" /> Copiar
      </Button>
      <a
        href={`/e/${slug}/login`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
      >
        <ExternalLink className="h-3 w-3" /> Abrir
      </a>
    </div>
  );
}

function VinculosManager({ ambienteId }: { ambienteId: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mt-2">
      <div className="px-5 py-3 border-b border-border bg-muted">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Vínculos com este ambiente</h3>
      </div>
      <div className="p-5 grid gap-6">
        <LinkSection
          ambienteId={ambienteId}
          title="Ferramentas"
          sourceTable="ferramentas"
          linkTable="ambiente_ferramentas"
          itemFkColumn="ferramenta_id"
          labelField="nome"
        />
        <LinkSection
          ambienteId={ambienteId}
          title="Novidades"
          sourceTable="novidades"
          linkTable="ambiente_novidades"
          itemFkColumn="novidade_id"
          labelField="titulo"
        />
        <LinkSection
          ambienteId={ambienteId}
          title="Cursos"
          sourceTable="cursos"
          linkTable="ambiente_cursos"
          itemFkColumn="curso_id"
          labelField="titulo"
        />
        <LinkSection
          ambienteId={ambienteId}
          title="Aulas avulsas"
          sourceTable="aulas"
          linkTable="ambiente_aulas"
          itemFkColumn="aula_id"
          labelField="titulo"
        />
      </div>
    </div>
  );
}

function LinkSection({
  ambienteId,
  title,
  sourceTable,
  linkTable,
  itemFkColumn,
  labelField,
}: {
  ambienteId: string;
  title: string;
  sourceTable: "ferramentas" | "novidades" | "aulas" | "cursos";
  linkTable: "ambiente_ferramentas" | "ambiente_novidades" | "ambiente_aulas" | "ambiente_cursos";
  itemFkColumn: "ferramenta_id" | "novidade_id" | "aula_id" | "curso_id";
  labelField: "nome" | "titulo";
}) {
  const [all, setAll] = useState<Linkable[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const sb: any = supabase;
    const [{ data: items }, { data: links }] = await Promise.all([
      sb.from(sourceTable).select(`id, ${labelField}`).order(labelField),
      sb.from(linkTable).select(itemFkColumn).eq("ambiente_id", ambienteId),
    ]);
    setAll(((items as any[]) ?? []) as Linkable[]);
    setLinkedIds(new Set(((links as any[]) ?? []).map((l) => l[itemFkColumn])));
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienteId]);

  async function toggle(itemId: string, currentlyLinked: boolean) {
    const sb: any = supabase;
    if (currentlyLinked) {
      const { error } = await sb
        .from(linkTable)
        .delete()
        .eq("ambiente_id", ambienteId)
        .eq(itemFkColumn, itemId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb
        .from(linkTable)
        .insert({ ambiente_id: ambienteId, [itemFkColumn]: itemId });
      if (error) return toast.error(error.message);
    }
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-secondary">{title}</h4>
        <span className="text-xs text-muted-foreground">{linkedIds.size} vinculadas</span>
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : all.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Nenhum item cadastrado globalmente ainda.
        </div>
      ) : (
        <div className="rounded-md border border-border divide-y divide-border max-h-56 overflow-auto">
          {all.map((it) => {
            const linked = linkedIds.has(it.id);
            const label = (it as any)[labelField] as string;
            return (
              <label
                key={it.id}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={linked}
                  onChange={() => toggle(it.id, linked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-secondary">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
