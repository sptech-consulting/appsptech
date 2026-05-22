
-- 1. Enum para tipo de apresentação
DO $$ BEGIN
  CREATE TYPE public.trabalho_apresentacao_tipo AS ENUM ('video','pptx','imagem','documento','link');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Novas colunas em trabalhos
ALTER TABLE public.trabalhos
  ADD COLUMN IF NOT EXISTS subtitulo text,
  ADD COLUMN IF NOT EXISTS apresentacao_tipo public.trabalho_apresentacao_tipo,
  ADD COLUMN IF NOT EXISTS apresentacao_url text,
  ADD COLUMN IF NOT EXISTS apresentacao_titulo text,
  ADD COLUMN IF NOT EXISTS apresentacao_descricao text,
  ADD COLUMN IF NOT EXISTS apresentacao_imagem_url text,
  ADD COLUMN IF NOT EXISTS aplicacao_expectativa text;

-- 3. Tabela trabalho_funcionalidades
CREATE TABLE IF NOT EXISTS public.trabalho_funcionalidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabalho_id uuid NOT NULL REFERENCES public.trabalhos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  titulo text NOT NULL,
  descricao text,
  imagem_url text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trabalho_func_trab ON public.trabalho_funcionalidades(trabalho_id, ordem);

ALTER TABLE public.trabalho_funcionalidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin gerencia funcionalidades trabalho" ON public.trabalho_funcionalidades;
CREATE POLICY "admin gerencia funcionalidades trabalho"
ON public.trabalho_funcionalidades FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trabalhos t
  WHERE t.id = trabalho_funcionalidades.trabalho_id
    AND public.is_admin_for_ambiente(t.ambiente_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trabalhos t
  WHERE t.id = trabalho_funcionalidades.trabalho_id
    AND public.is_admin_for_ambiente(t.ambiente_id)
));

DROP POLICY IF EXISTS "aluno vê funcionalidades publicadas" ON public.trabalho_funcionalidades;
CREATE POLICY "aluno vê funcionalidades publicadas"
ON public.trabalho_funcionalidades FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trabalhos t
  WHERE t.id = trabalho_funcionalidades.trabalho_id
    AND t.status = 'publicada'
    AND public.aluno_tem_ambiente(t.ambiente_id)
));

-- 4. Tabela trabalho_links
CREATE TABLE IF NOT EXISTS public.trabalho_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabalho_id uuid NOT NULL REFERENCES public.trabalhos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  rotulo text NOT NULL,
  url text NOT NULL,
  icone_url text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trabalho_links_trab ON public.trabalho_links(trabalho_id, ordem);

ALTER TABLE public.trabalho_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin gerencia links trabalho" ON public.trabalho_links;
CREATE POLICY "admin gerencia links trabalho"
ON public.trabalho_links FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trabalhos t
  WHERE t.id = trabalho_links.trabalho_id
    AND public.is_admin_for_ambiente(t.ambiente_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trabalhos t
  WHERE t.id = trabalho_links.trabalho_id
    AND public.is_admin_for_ambiente(t.ambiente_id)
));

DROP POLICY IF EXISTS "aluno vê links publicados" ON public.trabalho_links;
CREATE POLICY "aluno vê links publicados"
ON public.trabalho_links FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.trabalhos t
  WHERE t.id = trabalho_links.trabalho_id
    AND t.status = 'publicada'
    AND public.aluno_tem_ambiente(t.ambiente_id)
));

-- 5. Trigger atualizado_em em funcionalidades
DROP TRIGGER IF EXISTS trg_trab_func_upd ON public.trabalho_funcionalidades;
CREATE TRIGGER trg_trab_func_upd
BEFORE UPDATE ON public.trabalho_funcionalidades
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- 6. Atualizar RPC obter_trabalho_publico para incluir novos campos
DROP FUNCTION IF EXISTS public.obter_trabalho_publico(text, uuid);
CREATE OR REPLACE FUNCTION public.obter_trabalho_publico(_codigo text, _trabalho_id uuid)
RETURNS TABLE(
  id uuid, titulo text, subtitulo text, resumo text, conteudo text,
  autor_nome text, turma text, imagem_capa_url text, link_externo text, tags text[],
  publicado_em timestamptz, ambiente_nome text, ambiente_slug text,
  apresentacao_tipo public.trabalho_apresentacao_tipo,
  apresentacao_url text, apresentacao_titulo text, apresentacao_descricao text,
  apresentacao_imagem_url text, aplicacao_expectativa text,
  ordem integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.titulo, t.subtitulo, t.resumo, t.conteudo, t.autor_nome, t.turma,
         t.imagem_capa_url, t.link_externo, t.tags, t.publicado_em,
         a.nome, a.slug,
         t.apresentacao_tipo, t.apresentacao_url, t.apresentacao_titulo,
         t.apresentacao_descricao, t.apresentacao_imagem_url, t.aplicacao_expectativa,
         t.ordem
  FROM public.trabalhos t JOIN public.ambientes a ON a.id = t.ambiente_id
  WHERE t.id = _trabalho_id AND t.status = 'publicada' AND a.status = 'ativo'
    AND a.codigo_acesso_resultados IS NOT NULL
    AND a.codigo_acesso_resultados = upper(regexp_replace(coalesce(_codigo,''), '\s+', '', 'g'))
  LIMIT 1;
$$;

-- 7. RPC listar funcionalidades públicas
CREATE OR REPLACE FUNCTION public.listar_funcionalidades_publicas(_codigo text, _trabalho_id uuid)
RETURNS TABLE(id uuid, ordem integer, titulo text, descricao text, imagem_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.ordem, f.titulo, f.descricao, f.imagem_url
  FROM public.trabalho_funcionalidades f
  JOIN public.trabalhos t ON t.id = f.trabalho_id
  JOIN public.ambientes a ON a.id = t.ambiente_id
  WHERE t.id = _trabalho_id AND t.status = 'publicada' AND a.status = 'ativo'
    AND a.codigo_acesso_resultados IS NOT NULL
    AND a.codigo_acesso_resultados = upper(regexp_replace(coalesce(_codigo,''), '\s+', '', 'g'))
  ORDER BY f.ordem ASC, f.criado_em ASC;
$$;

-- 8. RPC listar links públicos
CREATE OR REPLACE FUNCTION public.listar_links_publicos(_codigo text, _trabalho_id uuid)
RETURNS TABLE(id uuid, ordem integer, rotulo text, url text, icone_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.ordem, l.rotulo, l.url, l.icone_url
  FROM public.trabalho_links l
  JOIN public.trabalhos t ON t.id = l.trabalho_id
  JOIN public.ambientes a ON a.id = t.ambiente_id
  WHERE t.id = _trabalho_id AND t.status = 'publicada' AND a.status = 'ativo'
    AND a.codigo_acesso_resultados IS NOT NULL
    AND a.codigo_acesso_resultados = upper(regexp_replace(coalesce(_codigo,''), '\s+', '', 'g'))
  ORDER BY l.ordem ASC, l.criado_em ASC;
$$;
