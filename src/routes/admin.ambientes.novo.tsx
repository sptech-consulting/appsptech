import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { AmbienteForm, type AmbienteFormState } from "@/components/AmbienteForm";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ambientes/novo")({
  component: NovoAmbiente,
});

function NovoAmbiente() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSave(state: AmbienteFormState) {
    if (!state.nome.trim() || !state.slug.trim()) {
      toast.error("Nome e slug são obrigatórios.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("ambientes")
      .insert({
        nome: state.nome,
        slug: state.slug,
        descricao: state.descricao || null,
        status: state.status,
        tema: state.tema,
        logo_url: state.logo_url,
        favicon_url: state.favicon_url,
        imagem_capa_url: state.imagem_capa_url,
        imagem_login_url: state.imagem_login_url,
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
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ambiente criado.");
    void navigate({ to: "/admin/ambientes/$id", params: { id: data.id } });
  }

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Novo ambiente"
        description="Defina dados, identidade visual e estilo dos cards. O preview é atualizado em tempo real."
        crumbs={[{ label: "Ambientes", to: "/admin/ambientes" }, { label: "Novo" }]}
      />
      <AmbienteForm onSubmit={handleSave} submitting={saving} submitLabel="Criar ambiente" />
    </div>
  );
}
