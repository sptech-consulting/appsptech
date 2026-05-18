
-- 1. Limpar dados antigos
DELETE FROM public.ambiente_novidades;
DELETE FROM public.novidades;

-- 2. Remover tabela de vínculo
DROP TABLE IF EXISTS public.ambiente_novidades CASCADE;

-- 3. Adicionar ambiente_id em novidades
ALTER TABLE public.novidades
  ADD COLUMN ambiente_id uuid NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE;

CREATE INDEX idx_novidades_ambiente ON public.novidades(ambiente_id);

-- 4. Adicionar webhook_token em ambientes
ALTER TABLE public.ambientes
  ADD COLUMN webhook_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

-- 5. Refazer RLS de novidades
DROP POLICY IF EXISTS "admin gerencia novidades" ON public.novidades;
DROP POLICY IF EXISTS "admin vê novidades" ON public.novidades;

CREATE POLICY "admin vê novidades do ambiente"
ON public.novidades FOR SELECT TO authenticated
USING (is_admin_for_ambiente(ambiente_id));

CREATE POLICY "admin gerencia novidades do ambiente"
ON public.novidades FOR ALL TO authenticated
USING (is_admin_for_ambiente(ambiente_id))
WITH CHECK (is_admin_for_ambiente(ambiente_id));

CREATE POLICY "aluno vê novidades publicadas do seu ambiente"
ON public.novidades FOR SELECT TO authenticated
USING (status = 'publicada' AND aluno_tem_ambiente(ambiente_id));
