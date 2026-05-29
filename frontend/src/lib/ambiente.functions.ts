import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getAmbienteBranding = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    if (!input?.slug || typeof input.slug !== "string" || input.slug.length > 120) {
      throw new Error("slug inválido");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("ambientes")
      .select(
        "id, nome, slug, status, tema, logo_url, imagem_login_url, cor_primaria, cor_secundaria, cor_fundo, cor_texto, cor_botao, cor_card, cor_borda, efeito_card_tilt_3d, efeito_card_glow, efeito_card_scale, efeito_botao_lift, efeito_entrada_animada, efeito_som_hover, efeito_som_volume, efeito_blobs_fundo"
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    if (row.status !== "ativo") return { ...row, _inativo: true as const };
    return row;
  });
