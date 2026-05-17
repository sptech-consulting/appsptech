-- ========== CURSOS ==========
CREATE TABLE public.cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  capa_url text,
  categoria text,
  carga_horaria_minutos integer,
  nivel text,
  status publicacao_status NOT NULL DEFAULT 'rascunho',
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_cursos_atualizado BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE POLICY "admin vê cursos" ON public.cursos FOR SELECT TO authenticated
  USING (is_any_admin());
CREATE POLICY "admin gerencia cursos" ON public.cursos FOR ALL TO authenticated
  USING (has_admin_permission('cursos.editar') OR has_admin_permission('cursos.criar'))
  WITH CHECK (has_admin_permission('cursos.criar') OR has_admin_permission('cursos.editar'));

-- ========== MODULOS ==========
CREATE TABLE public.modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_modulos_curso ON public.modulos(curso_id, ordem);
CREATE TRIGGER trg_modulos_atualizado BEFORE UPDATE ON public.modulos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ========== AULAS: vincular a módulo + ordem ==========
ALTER TABLE public.aulas
  ADD COLUMN modulo_id uuid REFERENCES public.modulos(id) ON DELETE SET NULL,
  ADD COLUMN ordem integer NOT NULL DEFAULT 0;
CREATE INDEX idx_aulas_modulo ON public.aulas(modulo_id, ordem);

-- ========== AMBIENTE_CURSOS ==========
CREATE TABLE public.ambiente_cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id uuid NOT NULL,
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  destaque boolean DEFAULT false,
  liberado boolean DEFAULT true,
  data_liberacao timestamptz,
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ambiente_id, curso_id)
);
ALTER TABLE public.ambiente_cursos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ambiente_cursos_amb ON public.ambiente_cursos(ambiente_id, ordem);

CREATE POLICY "leitura ambiente_cursos" ON public.ambiente_cursos FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) OR aluno_tem_ambiente(ambiente_id));
CREATE POLICY "admin gerencia vínculos cursos" ON public.ambiente_cursos FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('cursos.vincular_ambiente'))
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('cursos.vincular_ambiente'));

-- Policies de módulos / aulas que dependem de ambiente_cursos
CREATE POLICY "admin vê módulos" ON public.modulos FOR SELECT TO authenticated
  USING (is_any_admin());
CREATE POLICY "admin gerencia módulos" ON public.modulos FOR ALL TO authenticated
  USING (has_admin_permission('cursos.editar') OR has_admin_permission('cursos.criar'))
  WITH CHECK (has_admin_permission('cursos.editar') OR has_admin_permission('cursos.criar'));
CREATE POLICY "aluno vê módulos do seu ambiente" ON public.modulos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ambiente_cursos ac
      WHERE ac.curso_id = modulos.curso_id
        AND ac.status = 'ativo'
        AND aluno_tem_ambiente(ac.ambiente_id)
    )
  );

CREATE POLICY "aluno vê aulas do seu ambiente via curso" ON public.aulas FOR SELECT TO authenticated
  USING (
    modulo_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.modulos m
      JOIN public.ambiente_cursos ac ON ac.curso_id = m.curso_id
      WHERE m.id = aulas.modulo_id
        AND ac.status = 'ativo'
        AND aluno_tem_ambiente(ac.ambiente_id)
    )
  );

-- ========== PERMISSÕES ==========
INSERT INTO public.permissoes (chave, modulo, descricao) VALUES
  ('cursos.visualizar', 'cursos', 'Visualizar cursos'),
  ('cursos.criar', 'cursos', 'Criar cursos'),
  ('cursos.editar', 'cursos', 'Editar cursos'),
  ('cursos.arquivar', 'cursos', 'Arquivar/excluir cursos'),
  ('cursos.vincular_ambiente', 'cursos', 'Vincular cursos a ambientes')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO public.grupo_permissoes (grupo_id, permissao_id)
SELECT g.id, p.id
FROM public.grupos_acesso g
CROSS JOIN public.permissoes p
WHERE g.nome = 'Super Admin'
  AND p.chave LIKE 'cursos.%'
  AND NOT EXISTS (
    SELECT 1 FROM public.grupo_permissoes gp
    WHERE gp.grupo_id = g.id AND gp.permissao_id = p.id
  );