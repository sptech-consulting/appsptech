
-- 1. Novas colunas em ferramentas
ALTER TABLE public.ferramentas
  ADD COLUMN IF NOT EXISTS subtitulo TEXT,
  ADD COLUMN IF NOT EXISTS descricao_longa TEXT,
  ADD COLUMN IF NOT EXISTS imagem_capa_url TEXT,
  ADD COLUMN IF NOT EXISTS frase_destaque TEXT;

-- 2. Enum para tipo de tag
DO $$ BEGIN
  CREATE TYPE public.ferramenta_tag_tipo AS ENUM ('input', 'output', 'integracao');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Casos de uso (bullets)
CREATE TABLE IF NOT EXISTS public.ferramenta_casos_uso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fcu_ferramenta ON public.ferramenta_casos_uso(ferramenta_id, ordem);

-- 4. Tags (input/output/integração)
CREATE TABLE IF NOT EXISTS public.ferramenta_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
  tipo public.ferramenta_tag_tipo NOT NULL,
  rotulo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ft_ferramenta ON public.ferramenta_tags(ferramenta_id, tipo, ordem);

-- 5. Blocos de texto destacados
CREATE TABLE IF NOT EXISTS public.ferramenta_blocos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fb_ferramenta ON public.ferramenta_blocos(ferramenta_id, ordem);

-- 6. Funcionalidades expansíveis
CREATE TABLE IF NOT EXISTS public.ferramenta_funcionalidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ff_ferramenta ON public.ferramenta_funcionalidades(ferramenta_id, ordem);

-- 7. Casos de teste
CREATE TABLE IF NOT EXISTS public.ferramenta_casos_teste (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  badge TEXT,
  prompt_exemplo TEXT,
  explicacao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fct_ferramenta ON public.ferramenta_casos_teste(ferramenta_id, ordem);

-- 8. RLS
ALTER TABLE public.ferramenta_casos_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramenta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramenta_blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramenta_funcionalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramenta_casos_teste ENABLE ROW LEVEL SECURITY;

-- Helper expression repetida nas policies: leitura para admin OU aluno de ambiente que tem a ferramenta
-- Aplicada policy por policy

-- ferramenta_casos_uso
CREATE POLICY "admin gerencia casos uso"
  ON public.ferramenta_casos_uso FOR ALL TO authenticated
  USING (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'))
  WITH CHECK (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'));

CREATE POLICY "leitura casos uso"
  ON public.ferramenta_casos_uso FOR SELECT TO authenticated
  USING (
    is_any_admin()
    OR EXISTS (
      SELECT 1 FROM public.ambiente_ferramentas af
      WHERE af.ferramenta_id = ferramenta_casos_uso.ferramenta_id
        AND af.status = 'ativo'
        AND aluno_tem_ambiente(af.ambiente_id)
    )
  );

-- ferramenta_tags
CREATE POLICY "admin gerencia tags ferramenta"
  ON public.ferramenta_tags FOR ALL TO authenticated
  USING (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'))
  WITH CHECK (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'));

CREATE POLICY "leitura tags ferramenta"
  ON public.ferramenta_tags FOR SELECT TO authenticated
  USING (
    is_any_admin()
    OR EXISTS (
      SELECT 1 FROM public.ambiente_ferramentas af
      WHERE af.ferramenta_id = ferramenta_tags.ferramenta_id
        AND af.status = 'ativo'
        AND aluno_tem_ambiente(af.ambiente_id)
    )
  );

-- ferramenta_blocos
CREATE POLICY "admin gerencia blocos"
  ON public.ferramenta_blocos FOR ALL TO authenticated
  USING (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'))
  WITH CHECK (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'));

CREATE POLICY "leitura blocos"
  ON public.ferramenta_blocos FOR SELECT TO authenticated
  USING (
    is_any_admin()
    OR EXISTS (
      SELECT 1 FROM public.ambiente_ferramentas af
      WHERE af.ferramenta_id = ferramenta_blocos.ferramenta_id
        AND af.status = 'ativo'
        AND aluno_tem_ambiente(af.ambiente_id)
    )
  );

-- ferramenta_funcionalidades
CREATE POLICY "admin gerencia funcionalidades"
  ON public.ferramenta_funcionalidades FOR ALL TO authenticated
  USING (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'))
  WITH CHECK (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'));

CREATE POLICY "leitura funcionalidades"
  ON public.ferramenta_funcionalidades FOR SELECT TO authenticated
  USING (
    is_any_admin()
    OR EXISTS (
      SELECT 1 FROM public.ambiente_ferramentas af
      WHERE af.ferramenta_id = ferramenta_funcionalidades.ferramenta_id
        AND af.status = 'ativo'
        AND aluno_tem_ambiente(af.ambiente_id)
    )
  );

-- ferramenta_casos_teste
CREATE POLICY "admin gerencia casos teste"
  ON public.ferramenta_casos_teste FOR ALL TO authenticated
  USING (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'))
  WITH CHECK (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'));

CREATE POLICY "leitura casos teste"
  ON public.ferramenta_casos_teste FOR SELECT TO authenticated
  USING (
    is_any_admin()
    OR EXISTS (
      SELECT 1 FROM public.ambiente_ferramentas af
      WHERE af.ferramenta_id = ferramenta_casos_teste.ferramenta_id
        AND af.status = 'ativo'
        AND aluno_tem_ambiente(af.ambiente_id)
    )
  );
