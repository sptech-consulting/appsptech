CREATE POLICY "aluno vê cursos vinculados ao seu ambiente"
ON public.cursos
FOR SELECT
TO authenticated
USING (
  status = 'publicada'::publicacao_status
  AND EXISTS (
    SELECT 1
    FROM public.ambiente_cursos ac
    JOIN public.ambientes amb ON amb.id = ac.ambiente_id
    WHERE ac.curso_id = cursos.id
      AND ac.status = 'ativo'::generic_status
      AND coalesce(ac.liberado, true) = true
      AND (ac.data_liberacao IS NULL OR ac.data_liberacao <= now())
      AND amb.status = 'ativo'::ambiente_status
      AND public.aluno_tem_ambiente(ac.ambiente_id)
  )
);

CREATE POLICY "aluno vê ferramentas vinculadas ao seu ambiente"
ON public.ferramentas
FOR SELECT
TO authenticated
USING (
  status = 'ativo'::generic_status
  AND EXISTS (
    SELECT 1
    FROM public.ambiente_ferramentas af
    JOIN public.ambientes amb ON amb.id = af.ambiente_id
    WHERE af.ferramenta_id = ferramentas.id
      AND af.status = 'ativo'::generic_status
      AND amb.status = 'ativo'::ambiente_status
      AND public.aluno_tem_ambiente(af.ambiente_id)
  )
);