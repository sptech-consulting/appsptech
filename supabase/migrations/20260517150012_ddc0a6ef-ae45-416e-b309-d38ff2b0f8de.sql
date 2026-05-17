
ALTER TABLE public.ambientes
  ADD COLUMN IF NOT EXISTS efeito_card_tilt_3d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efeito_card_glow boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efeito_card_scale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efeito_botao_lift boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efeito_entrada_animada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efeito_som_hover boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efeito_som_volume integer NOT NULL DEFAULT 40 CHECK (efeito_som_volume BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS efeito_blobs_fundo boolean NOT NULL DEFAULT false;
