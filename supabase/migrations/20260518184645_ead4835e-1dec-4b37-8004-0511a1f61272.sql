ALTER TABLE public.ambientes
  ADD COLUMN IF NOT EXISTS playbook_titulo text,
  ADD COLUMN IF NOT EXISTS playbook_descricao text,
  ADD COLUMN IF NOT EXISTS playbook_capa_url text,
  ADD COLUMN IF NOT EXISTS playbook_arquivo_url text;