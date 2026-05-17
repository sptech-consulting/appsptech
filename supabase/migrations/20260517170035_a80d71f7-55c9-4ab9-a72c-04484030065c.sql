
-- Progresso do aluno por aula
CREATE TABLE public.aluno_aula_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL,
  aula_id uuid NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  concluida_em timestamptz,
  segundos_assistidos integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, aula_id)
);
ALTER TABLE public.aluno_aula_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno gerencia próprio progresso" ON public.aluno_aula_progresso
  FOR ALL TO authenticated
  USING (aluno_id = public.current_aluno_id())
  WITH CHECK (aluno_id = public.current_aluno_id());

CREATE POLICY "admin vê progresso" ON public.aluno_aula_progresso
  FOR SELECT TO authenticated
  USING (public.has_admin_permission('alunos.visualizar'));

CREATE TRIGGER set_atualizado_em_progresso BEFORE UPDATE ON public.aluno_aula_progresso
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- Comentários em aulas (com threading via parent_id)
CREATE TABLE public.aula_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL,
  ambiente_id uuid NOT NULL,
  aluno_id uuid,
  usuario_admin_id uuid,
  parent_id uuid REFERENCES public.aula_comentarios(id) ON DELETE CASCADE,
  conteudo text NOT NULL CHECK (length(conteudo) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'ativo',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aula_coment_aula ON public.aula_comentarios (aula_id, criado_em);
CREATE INDEX idx_aula_coment_parent ON public.aula_comentarios (parent_id);
ALTER TABLE public.aula_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura comentários por participantes" ON public.aula_comentarios
  FOR SELECT TO authenticated
  USING (
    status = 'ativo' AND (
      public.aluno_tem_ambiente(ambiente_id)
      OR public.is_admin_for_ambiente(ambiente_id)
    )
  );

CREATE POLICY "aluno cria comentário próprio" ON public.aula_comentarios
  FOR INSERT TO authenticated
  WITH CHECK (
    aluno_id = public.current_aluno_id()
    AND public.aluno_tem_ambiente(ambiente_id)
  );

CREATE POLICY "admin cria comentário" ON public.aula_comentarios
  FOR INSERT TO authenticated
  WITH CHECK (
    usuario_admin_id = public.current_admin_id()
    AND public.is_admin_for_ambiente(ambiente_id)
  );

CREATE POLICY "aluno edita/remove próprio comentário" ON public.aula_comentarios
  FOR UPDATE TO authenticated
  USING (aluno_id = public.current_aluno_id())
  WITH CHECK (aluno_id = public.current_aluno_id());

CREATE POLICY "admin modera comentários" ON public.aula_comentarios
  FOR UPDATE TO authenticated
  USING (public.is_admin_for_ambiente(ambiente_id))
  WITH CHECK (public.is_admin_for_ambiente(ambiente_id));

CREATE TRIGGER set_atualizado_em_aula_coment BEFORE UPDATE ON public.aula_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- Curtidas em comentários
CREATE TABLE public.aula_comentario_curtidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id uuid NOT NULL REFERENCES public.aula_comentarios(id) ON DELETE CASCADE,
  aluno_id uuid,
  usuario_admin_id uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_aluno_curtida UNIQUE (comentario_id, aluno_id),
  CONSTRAINT uniq_admin_curtida UNIQUE (comentario_id, usuario_admin_id),
  CONSTRAINT autor_obrigatorio CHECK (
    (aluno_id IS NOT NULL AND usuario_admin_id IS NULL)
    OR (aluno_id IS NULL AND usuario_admin_id IS NOT NULL)
  )
);
ALTER TABLE public.aula_comentario_curtidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura curtidas por participantes do ambiente" ON public.aula_comentario_curtidas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.aula_comentarios c
      WHERE c.id = aula_comentario_curtidas.comentario_id
        AND (public.aluno_tem_ambiente(c.ambiente_id) OR public.is_admin_for_ambiente(c.ambiente_id))
    )
  );

CREATE POLICY "aluno curte/descurte" ON public.aula_comentario_curtidas
  FOR ALL TO authenticated
  USING (aluno_id = public.current_aluno_id())
  WITH CHECK (
    aluno_id = public.current_aluno_id()
    AND EXISTS (
      SELECT 1 FROM public.aula_comentarios c
      WHERE c.id = aula_comentario_curtidas.comentario_id
        AND public.aluno_tem_ambiente(c.ambiente_id)
    )
  );

CREATE POLICY "admin curte/descurte" ON public.aula_comentario_curtidas
  FOR ALL TO authenticated
  USING (usuario_admin_id = public.current_admin_id())
  WITH CHECK (
    usuario_admin_id = public.current_admin_id()
    AND EXISTS (
      SELECT 1 FROM public.aula_comentarios c
      WHERE c.id = aula_comentario_curtidas.comentario_id
        AND public.is_admin_for_ambiente(c.ambiente_id)
    )
  );

-- Permissões para moderar comentários (admin)
INSERT INTO public.permissoes (chave, modulo, descricao) VALUES
  ('comentarios.visualizar', 'comentarios', 'Visualizar comentários de aulas'),
  ('comentarios.moderar', 'comentarios', 'Moderar/ocultar comentários de aulas')
ON CONFLICT DO NOTHING;

INSERT INTO public.grupo_permissoes (grupo_id, permissao_id)
SELECT g.id, p.id
FROM public.grupos_acesso g
CROSS JOIN public.permissoes p
WHERE g.nome = 'Super Admin'
  AND p.chave IN ('comentarios.visualizar', 'comentarios.moderar')
ON CONFLICT DO NOTHING;
