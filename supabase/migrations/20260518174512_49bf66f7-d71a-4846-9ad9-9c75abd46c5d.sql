
CREATE OR REPLACE FUNCTION public.slugify_pt(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT btrim(
    regexp_replace(
      lower(
        translate(
          coalesce(_txt, ''),
          'áàâãäåāăąçćčďđéèêëēĕėęěğģíìîïĩīĭįıĵķĺļľłńņňñóòôõöøōŏőŕŗřśşšţťúùûüũūŭůűųŵýÿŷźżžÁÀÂÃÄÅĀĂĄÇĆČĎĐÉÈÊËĒĔĖĘĚĞĢÍÌÎÏĨĪĬĮİĴĶĹĻĽŁŃŅŇÑÓÒÔÕÖØŌŎŐŔŖŘŚŞŠŢŤÚÙÛÜŨŪŬŮŰŲŴÝŸŶŹŻŽ',
          'aaaaaaaaacccddeeeeeeeeegggiiiiiiiiijkllllnnnnoooooooooorrrsssttuuuuuuuuuuwyyyzzzaaaaaaaaacccddeeeeeeeeegggiiiiiiiiijkllllnnnnoooooooooorrrsssttuuuuuuuuuuwyyyzzz'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-'
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_unique_slug(_table regclass, _base text, _exclude_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _candidate text;
  _i int := 1;
  _exists boolean;
BEGIN
  _candidate := nullif(_base, '');
  IF _candidate IS NULL THEN _candidate := 'item'; END IF;

  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2))', _table)
      INTO _exists USING _candidate, _exclude_id;
    EXIT WHEN NOT _exists;
    _i := _i + 1;
    _candidate := _base || '-' || _i;
  END LOOP;
  RETURN _candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_set_slug_from_titulo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _src text;
  _base text;
BEGIN
  IF TG_TABLE_NAME = 'ferramentas' THEN
    _src := NEW.nome;
  ELSE
    _src := NEW.titulo;
  END IF;

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    _base := public.slugify_pt(_src);
    NEW.slug := public.ensure_unique_slug(TG_TABLE_NAME::regclass, _base, NEW.id);
  ELSE
    NEW.slug := public.slugify_pt(NEW.slug);
    NEW.slug := public.ensure_unique_slug(TG_TABLE_NAME::regclass, NEW.slug, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE public.ferramentas ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.aulas       ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.novidades   ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.trabalhos   ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.ferramentas SET slug = public.ensure_unique_slug('public.ferramentas'::regclass, public.slugify_pt(nome),   id) WHERE slug IS NULL OR slug = '';
UPDATE public.aulas       SET slug = public.ensure_unique_slug('public.aulas'::regclass,       public.slugify_pt(titulo), id) WHERE slug IS NULL OR slug = '';
UPDATE public.novidades   SET slug = public.ensure_unique_slug('public.novidades'::regclass,   public.slugify_pt(titulo), id) WHERE slug IS NULL OR slug = '';
UPDATE public.trabalhos   SET slug = public.ensure_unique_slug('public.trabalhos'::regclass,   public.slugify_pt(titulo), id) WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS ferramentas_slug_key ON public.ferramentas (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS aulas_slug_key       ON public.aulas       (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS novidades_slug_key   ON public.novidades   (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trabalhos_slug_key   ON public.trabalhos   (slug) WHERE slug IS NOT NULL;

DROP TRIGGER IF EXISTS set_slug_ferramentas ON public.ferramentas;
CREATE TRIGGER set_slug_ferramentas BEFORE INSERT OR UPDATE ON public.ferramentas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_slug_from_titulo();

DROP TRIGGER IF EXISTS set_slug_aulas ON public.aulas;
CREATE TRIGGER set_slug_aulas BEFORE INSERT OR UPDATE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_slug_from_titulo();

DROP TRIGGER IF EXISTS set_slug_novidades ON public.novidades;
CREATE TRIGGER set_slug_novidades BEFORE INSERT OR UPDATE ON public.novidades
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_slug_from_titulo();

DROP TRIGGER IF EXISTS set_slug_trabalhos ON public.trabalhos;
CREATE TRIGGER set_slug_trabalhos BEFORE INSERT OR UPDATE ON public.trabalhos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_slug_from_titulo();
