
ALTER TABLE public.ambientes ADD COLUMN IF NOT EXISTS codigo_acesso_resultados text;

CREATE OR REPLACE FUNCTION public.normalize_codigo_resultados()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.codigo_acesso_resultados IS NOT NULL THEN
    NEW.codigo_acesso_resultados := upper(regexp_replace(NEW.codigo_acesso_resultados, '\s+', '', 'g'));
    IF length(NEW.codigo_acesso_resultados) = 0 THEN NEW.codigo_acesso_resultados := NULL; END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_normalize_codigo_resultados ON public.ambientes;
CREATE TRIGGER trg_normalize_codigo_resultados
  BEFORE INSERT OR UPDATE OF codigo_acesso_resultados ON public.ambientes
  FOR EACH ROW EXECUTE FUNCTION public.normalize_codigo_resultados();

CREATE UNIQUE INDEX IF NOT EXISTS ambientes_codigo_resultados_uidx
  ON public.ambientes (codigo_acesso_resultados) WHERE codigo_acesso_resultados IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.trabalhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id uuid NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  resumo text,
  conteudo text,
  autor_nome text NOT NULL,
  turma text,
  imagem_capa_url text,
  link_externo text,
  tags text[] DEFAULT '{}'::text[],
  status publicacao_status NOT NULL DEFAULT 'rascunho',
  destaque boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  publicado_em timestamptz,
  visualizacoes integer NOT NULL DEFAULT 0,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trabalhos_ambiente ON public.trabalhos(ambiente_id, status, ordem);

DROP TRIGGER IF EXISTS trg_trabalhos_atualizado_em ON public.trabalhos;
CREATE TRIGGER trg_trabalhos_atualizado_em BEFORE UPDATE ON public.trabalhos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

ALTER TABLE public.trabalhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin gerencia trabalhos" ON public.trabalhos FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id)) WITH CHECK (is_admin_for_ambiente(ambiente_id));

CREATE POLICY "aluno vê trabalhos publicados" ON public.trabalhos FOR SELECT TO authenticated
  USING (status = 'publicada' AND aluno_tem_ambiente(ambiente_id));

CREATE OR REPLACE FUNCTION public.resolver_ambiente_por_codigo(_codigo text)
RETURNS TABLE(ambiente_id uuid, nome text, slug text, logo_url text,
  cor_primaria text, cor_secundaria text, cor_fundo text, cor_texto text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.nome, a.slug, a.logo_url, a.cor_primaria, a.cor_secundaria, a.cor_fundo, a.cor_texto
  FROM public.ambientes a
  WHERE a.status = 'ativo' AND a.codigo_acesso_resultados IS NOT NULL
    AND a.codigo_acesso_resultados = upper(regexp_replace(coalesce(_codigo,''), '\s+', '', 'g'))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.listar_trabalhos_publicos(_codigo text)
RETURNS TABLE(id uuid, titulo text, resumo text, autor_nome text, turma text,
  imagem_capa_url text, tags text[], destaque boolean, publicado_em timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.titulo, t.resumo, t.autor_nome, t.turma, t.imagem_capa_url, t.tags, t.destaque, t.publicado_em
  FROM public.trabalhos t JOIN public.ambientes a ON a.id = t.ambiente_id
  WHERE t.status = 'publicada' AND a.status = 'ativo'
    AND a.codigo_acesso_resultados IS NOT NULL
    AND a.codigo_acesso_resultados = upper(regexp_replace(coalesce(_codigo,''), '\s+', '', 'g'))
  ORDER BY t.destaque DESC, t.ordem ASC, t.publicado_em DESC NULLS LAST, t.criado_em DESC;
$$;

CREATE OR REPLACE FUNCTION public.obter_trabalho_publico(_codigo text, _trabalho_id uuid)
RETURNS TABLE(id uuid, titulo text, resumo text, conteudo text, autor_nome text, turma text,
  imagem_capa_url text, link_externo text, tags text[], publicado_em timestamptz,
  ambiente_nome text, ambiente_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.titulo, t.resumo, t.conteudo, t.autor_nome, t.turma, t.imagem_capa_url,
         t.link_externo, t.tags, t.publicado_em, a.nome, a.slug
  FROM public.trabalhos t JOIN public.ambientes a ON a.id = t.ambiente_id
  WHERE t.id = _trabalho_id AND t.status = 'publicada' AND a.status = 'ativo'
    AND a.codigo_acesso_resultados IS NOT NULL
    AND a.codigo_acesso_resultados = upper(regexp_replace(coalesce(_codigo,''), '\s+', '', 'g'))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolver_ambiente_por_codigo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_trabalhos_publicos(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_trabalho_publico(text, uuid) TO anon, authenticated;
