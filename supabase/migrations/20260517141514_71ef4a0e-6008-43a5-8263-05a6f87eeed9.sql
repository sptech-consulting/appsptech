
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE ambiente_status AS ENUM ('ativo','inativo','rascunho','arquivado');
CREATE TYPE ambiente_tema AS ENUM ('claro','escuro','personalizado');
CREATE TYPE card_estilo_t AS ENUM ('flat','sombra','borda','imagem');
CREATE TYPE card_borda_t AS ENUM ('quadrado','levemente_arredondado','arredondado','pill');
CREATE TYPE card_tamanho_t AS ENUM ('compacto','medio','grande');
CREATE TYPE generic_status AS ENUM ('ativo','inativo');
CREATE TYPE publicacao_status AS ENUM ('rascunho','publicada','arquivada');
CREATE TYPE aluno_status AS ENUM ('ativo','inativo','bloqueado');
CREATE TYPE importacao_status AS ENUM ('pendente','processando','concluida','com_erros','falhou');
CREATE TYPE importacao_tipo AS ENUM ('csv','xlsx');
CREATE TYPE grupo_escopo AS ENUM ('global','ambiente');
CREATE TYPE ferramenta_abertura AS ENUM ('nova_aba','mesma_aba','modal');
CREATE TYPE aula_tipo AS ENUM ('video','texto','pdf','link','misto');

-- =========================================================
-- AMBIENTES
-- =========================================================
CREATE TABLE public.ambientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  status ambiente_status NOT NULL DEFAULT 'rascunho',
  logo_url TEXT,
  favicon_url TEXT,
  imagem_capa_url TEXT,
  imagem_login_url TEXT,
  cor_primaria TEXT DEFAULT '#ED145B',
  cor_secundaria TEXT DEFAULT '#1F2A44',
  cor_fundo TEXT DEFAULT '#FFFFFF',
  cor_texto TEXT DEFAULT '#1F2A44',
  cor_botao TEXT DEFAULT '#ED145B',
  cor_card TEXT DEFAULT '#FFFFFF',
  cor_borda TEXT DEFAULT '#D0D3D4',
  tema ambiente_tema NOT NULL DEFAULT 'claro',
  layout_home JSONB DEFAULT '{}'::jsonb,
  card_estilo card_estilo_t DEFAULT 'sombra',
  card_borda card_borda_t DEFAULT 'arredondado',
  card_tamanho card_tamanho_t DEFAULT 'medio',
  card_exibir_icone BOOLEAN DEFAULT true,
  card_exibir_imagem BOOLEAN DEFAULT true,
  card_sombra BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por UUID
);
CREATE INDEX idx_ambientes_status ON public.ambientes(status);

-- =========================================================
-- CONFIGURACOES_AMBIENTE
-- =========================================================
CREATE TABLE public.configuracoes_ambiente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id UUID NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ambiente_id, chave)
);

-- =========================================================
-- FERRAMENTAS
-- =========================================================
CREATE TABLE public.ferramentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  url TEXT,
  icone_url TEXT,
  categoria TEXT,
  tipo_abertura ferramenta_abertura DEFAULT 'nova_aba',
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por UUID
);

CREATE TABLE public.ambiente_ferramentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id UUID NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
  ordem INT DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ambiente_id, ferramenta_id)
);

-- =========================================================
-- NOVIDADES
-- =========================================================
CREATE TABLE public.novidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  imagem_url TEXT,
  fonte_nome TEXT,
  fonte_url TEXT,
  categoria TEXT,
  tags TEXT[],
  publicado_em TIMESTAMPTZ,
  status publicacao_status NOT NULL DEFAULT 'rascunho',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por UUID
);

CREATE TABLE public.ambiente_novidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id UUID NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  novidade_id UUID NOT NULL REFERENCES public.novidades(id) ON DELETE CASCADE,
  destaque BOOLEAN DEFAULT false,
  ordem INT DEFAULT 0,
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ambiente_id, novidade_id)
);

-- =========================================================
-- AULAS
-- =========================================================
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT,
  material_url TEXT,
  thumbnail_url TEXT,
  modulo TEXT,
  duracao_minutos INT,
  tipo_conteudo aula_tipo DEFAULT 'video',
  status publicacao_status NOT NULL DEFAULT 'rascunho',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por UUID
);

CREATE TABLE public.ambiente_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id UUID NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  ordem INT DEFAULT 0,
  modulo_ordem INT DEFAULT 0,
  liberado BOOLEAN DEFAULT true,
  data_liberacao TIMESTAMPTZ,
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ambiente_id, aula_id)
);

-- =========================================================
-- ALUNOS
-- =========================================================
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  nome_completo TEXT NOT NULL,
  email_acesso TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  status aluno_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ambiente_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id UUID NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  status generic_status NOT NULL DEFAULT 'ativo',
  origem TEXT,
  importacao_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ambiente_id, aluno_id)
);

-- =========================================================
-- IMPORTACOES
-- =========================================================
CREATE TABLE public.importacoes_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambiente_id UUID NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  arquivo_nome TEXT,
  arquivo_url TEXT,
  tipo_arquivo importacao_tipo,
  total_linhas INT DEFAULT 0,
  total_importados INT DEFAULT 0,
  total_atualizados INT DEFAULT 0,
  total_erros INT DEFAULT 0,
  status importacao_status NOT NULL DEFAULT 'pendente',
  criado_por UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ
);

CREATE TABLE public.importacoes_alunos_erros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  importacao_id UUID NOT NULL REFERENCES public.importacoes_alunos(id) ON DELETE CASCADE,
  numero_linha INT,
  nome_completo TEXT,
  email_acesso TEXT,
  whatsapp TEXT,
  erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ambiente_alunos
  ADD CONSTRAINT fk_aa_importacao FOREIGN KEY (importacao_id)
  REFERENCES public.importacoes_alunos(id) ON DELETE SET NULL;

-- =========================================================
-- USUARIOS ADMIN / GRUPOS / PERMISSOES
-- =========================================================
CREATE TABLE public.usuarios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_acesso_em TIMESTAMPTZ
);

CREATE TABLE public.grupos_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  escopo grupo_escopo NOT NULL DEFAULT 'ambiente',
  status generic_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  modulo TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.grupo_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos_acesso(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grupo_id, permissao_id)
);

CREATE TABLE public.usuarios_admin_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_admin_id UUID NOT NULL REFERENCES public.usuarios_admin(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos_acesso(id) ON DELETE CASCADE,
  ambiente_id UUID REFERENCES public.ambientes(id) ON DELETE CASCADE,
  acesso_global BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_uag_unique ON public.usuarios_admin_grupos(
  usuario_admin_id, grupo_id, COALESCE(ambiente_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- =========================================================
-- LOGS AUDITORIA
-- =========================================================
CREATE TABLE public.logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_admin_id UUID,
  ambiente_id UUID,
  acao TEXT NOT NULL,
  entidade TEXT,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- SECURITY DEFINER FUNCTIONS (RBAC, sem recursão de RLS)
-- =========================================================
CREATE OR REPLACE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.usuarios_admin WHERE auth_user_id = auth.uid() AND status = 'ativo' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_aluno_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.alunos WHERE auth_user_id = auth.uid() AND status = 'ativo' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(_permissao TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_admin ua
    JOIN public.usuarios_admin_grupos uag ON uag.usuario_admin_id = ua.id
    JOIN public.grupo_permissoes gp ON gp.grupo_id = uag.grupo_id
    JOIN public.permissoes p ON p.id = gp.permissao_id
    WHERE ua.auth_user_id = auth.uid()
      AND ua.status = 'ativo'
      AND p.chave = _permissao
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_for_ambiente(_ambiente_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_admin ua
    JOIN public.usuarios_admin_grupos uag ON uag.usuario_admin_id = ua.id
    WHERE ua.auth_user_id = auth.uid()
      AND ua.status = 'ativo'
      AND (uag.acesso_global = true OR uag.ambiente_id = _ambiente_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios_admin WHERE auth_user_id = auth.uid() AND status = 'ativo');
$$;

CREATE OR REPLACE FUNCTION public.aluno_tem_ambiente(_ambiente_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.alunos a
    JOIN public.ambiente_alunos aa ON aa.aluno_id = a.id
    JOIN public.ambientes amb ON amb.id = aa.ambiente_id
    WHERE a.auth_user_id = auth.uid()
      AND a.status = 'ativo'
      AND aa.status = 'ativo'
      AND amb.status = 'ativo'
      AND aa.ambiente_id = _ambiente_id
  );
$$;

-- =========================================================
-- UPDATED_AT trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['ambientes','configuracoes_ambiente','ferramentas','ambiente_ferramentas','novidades','aulas','alunos','ambiente_alunos','usuarios_admin','grupos_acesso'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_upd_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em()', t, t);
  END LOOP;
END $$;

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.ambientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_ambiente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambiente_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambiente_novidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambiente_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambiente_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importacoes_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importacoes_alunos_erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupo_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_admin_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- AMBIENTES
CREATE POLICY "admin global vê todos ambientes" ON public.ambientes FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(id));
CREATE POLICY "aluno vê ambientes vinculados ativos" ON public.ambientes FOR SELECT TO authenticated
  USING (status = 'ativo' AND aluno_tem_ambiente(id));
CREATE POLICY "admin com permissão cria ambiente" ON public.ambientes FOR INSERT TO authenticated
  WITH CHECK (has_admin_permission('ambientes.criar'));
CREATE POLICY "admin com permissão edita ambiente" ON public.ambientes FOR UPDATE TO authenticated
  USING (has_admin_permission('ambientes.editar') AND is_admin_for_ambiente(id));
CREATE POLICY "admin com permissão deleta ambiente" ON public.ambientes FOR DELETE TO authenticated
  USING (has_admin_permission('ambientes.arquivar') AND is_admin_for_ambiente(id));

-- CONFIGURACOES_AMBIENTE
CREATE POLICY "leitura por admin ou aluno do ambiente" ON public.configuracoes_ambiente FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) OR aluno_tem_ambiente(ambiente_id));
CREATE POLICY "admin gerencia configs" ON public.configuracoes_ambiente FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('ambientes.personalizar'))
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('ambientes.personalizar'));

-- FERRAMENTAS
CREATE POLICY "admin vê ferramentas" ON public.ferramentas FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia ferramentas" ON public.ferramentas FOR ALL TO authenticated
  USING (has_admin_permission('ferramentas.editar') OR has_admin_permission('ferramentas.criar'))
  WITH CHECK (has_admin_permission('ferramentas.criar') OR has_admin_permission('ferramentas.editar'));

CREATE POLICY "leitura ambiente_ferramentas" ON public.ambiente_ferramentas FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) OR aluno_tem_ambiente(ambiente_id));
CREATE POLICY "admin gerencia vínculos ferramentas" ON public.ambiente_ferramentas FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('ferramentas.vincular_ambiente'))
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('ferramentas.vincular_ambiente'));

-- NOVIDADES
CREATE POLICY "admin vê novidades" ON public.novidades FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia novidades" ON public.novidades FOR ALL TO authenticated
  USING (has_admin_permission('novidades.editar') OR has_admin_permission('novidades.criar'))
  WITH CHECK (has_admin_permission('novidades.criar') OR has_admin_permission('novidades.editar'));

CREATE POLICY "leitura ambiente_novidades" ON public.ambiente_novidades FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) OR aluno_tem_ambiente(ambiente_id));
CREATE POLICY "admin gerencia vínculos novidades" ON public.ambiente_novidades FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('novidades.vincular_ambiente'))
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('novidades.vincular_ambiente'));

-- AULAS
CREATE POLICY "admin vê aulas" ON public.aulas FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia aulas" ON public.aulas FOR ALL TO authenticated
  USING (has_admin_permission('aulas.editar') OR has_admin_permission('aulas.criar'))
  WITH CHECK (has_admin_permission('aulas.criar') OR has_admin_permission('aulas.editar'));

CREATE POLICY "leitura ambiente_aulas" ON public.ambiente_aulas FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) OR aluno_tem_ambiente(ambiente_id));
CREATE POLICY "admin gerencia vínculos aulas" ON public.ambiente_aulas FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('aulas.vincular_ambiente'))
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('aulas.vincular_ambiente'));

-- ALUNOS
CREATE POLICY "aluno vê próprio registro" ON public.alunos FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
CREATE POLICY "admin vê alunos" ON public.alunos FOR SELECT TO authenticated
  USING (has_admin_permission('alunos.visualizar'));
CREATE POLICY "admin gerencia alunos" ON public.alunos FOR ALL TO authenticated
  USING (has_admin_permission('alunos.editar') OR has_admin_permission('alunos.criar'))
  WITH CHECK (has_admin_permission('alunos.criar') OR has_admin_permission('alunos.editar'));

CREATE POLICY "leitura ambiente_alunos" ON public.ambiente_alunos FOR SELECT TO authenticated
  USING (
    (aluno_id = current_aluno_id()) OR
    (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('alunos.visualizar'))
  );
CREATE POLICY "admin gerencia vínculos alunos" ON public.ambiente_alunos FOR ALL TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('alunos.vincular_ambiente'))
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('alunos.vincular_ambiente'));

-- IMPORTACOES
CREATE POLICY "admin vê importações" ON public.importacoes_alunos FOR SELECT TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('alunos.importar'));
CREATE POLICY "admin cria importações" ON public.importacoes_alunos FOR INSERT TO authenticated
  WITH CHECK (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('alunos.importar'));
CREATE POLICY "admin atualiza importações" ON public.importacoes_alunos FOR UPDATE TO authenticated
  USING (is_admin_for_ambiente(ambiente_id) AND has_admin_permission('alunos.importar'));

CREATE POLICY "admin vê erros importação" ON public.importacoes_alunos_erros FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.importacoes_alunos i WHERE i.id = importacao_id AND is_admin_for_ambiente(i.ambiente_id)));
CREATE POLICY "admin insere erros importação" ON public.importacoes_alunos_erros FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.importacoes_alunos i WHERE i.id = importacao_id AND is_admin_for_ambiente(i.ambiente_id)));

-- USUARIOS ADMIN / GRUPOS
CREATE POLICY "admin vê próprio registro admin" ON public.usuarios_admin FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR has_admin_permission('usuarios.visualizar'));
CREATE POLICY "admin gerencia usuários" ON public.usuarios_admin FOR ALL TO authenticated
  USING (has_admin_permission('usuarios.editar') OR has_admin_permission('usuarios.criar'))
  WITH CHECK (has_admin_permission('usuarios.criar') OR has_admin_permission('usuarios.editar'));

CREATE POLICY "admin vê grupos" ON public.grupos_acesso FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia grupos" ON public.grupos_acesso FOR ALL TO authenticated
  USING (has_admin_permission('grupos.editar') OR has_admin_permission('grupos.criar'))
  WITH CHECK (has_admin_permission('grupos.criar') OR has_admin_permission('grupos.editar'));

CREATE POLICY "admin vê permissões" ON public.permissoes FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia permissões" ON public.permissoes FOR ALL TO authenticated
  USING (has_admin_permission('permissoes.gerenciar'))
  WITH CHECK (has_admin_permission('permissoes.gerenciar'));

CREATE POLICY "admin vê vínculos grupo-permissão" ON public.grupo_permissoes FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia grupo-permissão" ON public.grupo_permissoes FOR ALL TO authenticated
  USING (has_admin_permission('grupos.vincular_permissoes'))
  WITH CHECK (has_admin_permission('grupos.vincular_permissoes'));

CREATE POLICY "admin vê vínculos usuário-grupo" ON public.usuarios_admin_grupos FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin gerencia vínculos usuário-grupo" ON public.usuarios_admin_grupos FOR ALL TO authenticated
  USING (has_admin_permission('usuarios.vincular_grupo'))
  WITH CHECK (has_admin_permission('usuarios.vincular_grupo'));

-- LOGS
CREATE POLICY "admin vê logs" ON public.logs_auditoria FOR SELECT TO authenticated USING (is_any_admin());
CREATE POLICY "admin insere logs" ON public.logs_auditoria FOR INSERT TO authenticated WITH CHECK (is_any_admin());

-- =========================================================
-- SEED: PERMISSÕES
-- =========================================================
INSERT INTO public.permissoes (chave, modulo, descricao) VALUES
('ambientes.visualizar','ambientes','Visualizar ambientes'),
('ambientes.criar','ambientes','Criar ambientes'),
('ambientes.editar','ambientes','Editar ambientes'),
('ambientes.inativar','ambientes','Inativar ambientes'),
('ambientes.personalizar','ambientes','Personalizar ambientes'),
('ambientes.arquivar','ambientes','Arquivar ambientes'),
('ferramentas.visualizar','ferramentas','Visualizar ferramentas'),
('ferramentas.criar','ferramentas','Criar ferramentas'),
('ferramentas.editar','ferramentas','Editar ferramentas'),
('ferramentas.inativar','ferramentas','Inativar ferramentas'),
('ferramentas.vincular_ambiente','ferramentas','Vincular ferramentas a ambientes'),
('novidades.visualizar','novidades','Visualizar novidades'),
('novidades.criar','novidades','Criar novidades'),
('novidades.editar','novidades','Editar novidades'),
('novidades.publicar','novidades','Publicar novidades'),
('novidades.arquivar','novidades','Arquivar novidades'),
('novidades.vincular_ambiente','novidades','Vincular novidades a ambientes'),
('aulas.visualizar','aulas','Visualizar aulas'),
('aulas.criar','aulas','Criar aulas'),
('aulas.editar','aulas','Editar aulas'),
('aulas.publicar','aulas','Publicar aulas'),
('aulas.arquivar','aulas','Arquivar aulas'),
('aulas.vincular_ambiente','aulas','Vincular aulas a ambientes'),
('alunos.visualizar','alunos','Visualizar alunos'),
('alunos.criar','alunos','Criar alunos'),
('alunos.editar','alunos','Editar alunos'),
('alunos.importar','alunos','Importar alunos'),
('alunos.inativar','alunos','Inativar alunos'),
('alunos.vincular_ambiente','alunos','Vincular alunos a ambientes'),
('usuarios.visualizar','usuarios','Visualizar usuários admin'),
('usuarios.criar','usuarios','Criar usuários admin'),
('usuarios.editar','usuarios','Editar usuários admin'),
('usuarios.bloquear','usuarios','Bloquear usuários admin'),
('usuarios.vincular_grupo','usuarios','Vincular usuários a grupos'),
('grupos.visualizar','grupos','Visualizar grupos'),
('grupos.criar','grupos','Criar grupos'),
('grupos.editar','grupos','Editar grupos'),
('grupos.vincular_permissoes','grupos','Vincular permissões a grupos'),
('permissoes.visualizar','permissoes','Visualizar permissões'),
('permissoes.gerenciar','permissoes','Gerenciar permissões');

-- =========================================================
-- SEED: GRUPO SUPER ADMIN com todas permissões
-- =========================================================
INSERT INTO public.grupos_acesso (nome, descricao, escopo) VALUES
('Super Admin','Acesso total ao sistema','global');

INSERT INTO public.grupo_permissoes (grupo_id, permissao_id)
SELECT g.id, p.id FROM public.grupos_acesso g, public.permissoes p
WHERE g.nome = 'Super Admin';

-- =========================================================
-- SEED: AMBIENTES MOCKADOS
-- =========================================================
INSERT INTO public.ambientes (nome, slug, descricao, status, tema, cor_primaria, cor_secundaria, cor_fundo, cor_texto, cor_botao, cor_card, cor_borda, card_estilo, card_borda, card_tamanho)
VALUES
('Ecorodovias','ecorodovias','Ambiente corporativo Ecorodovias','ativo','personalizado','#1F7A3D','#0B4D80','#F4F7F5','#1F2A44','#1F7A3D','#FFFFFF','#D0D3D4','sombra','arredondado','medio'),
('SPTech Demo','sptech-demo','Ambiente demonstração SPTech','ativo','claro','#ED145B','#1F2A44','#FFFFFF','#1F2A44','#ED145B','#FFFFFF','#D0D3D4','flat','levemente_arredondado','medio');

-- layout_home padrão dos ambientes seed
UPDATE public.ambientes SET layout_home = '{
  "secoes":[
    {"tipo":"banner","titulo":"Bem-vindo","ordem":1,"visivel":true},
    {"tipo":"ferramentas","titulo":"Ferramentas","ordem":2,"visivel":true,"modo_exibicao":"grid","limite_itens":8},
    {"tipo":"aulas","titulo":"Área do Aluno","ordem":3,"visivel":true,"modo_exibicao":"carrossel","limite_itens":6},
    {"tipo":"novidades","titulo":"Novidades","ordem":4,"visivel":true,"modo_exibicao":"lista","limite_itens":5}
  ]
}'::jsonb WHERE slug = 'ecorodovias';

UPDATE public.ambientes SET layout_home = '{
  "secoes":[
    {"tipo":"banner","titulo":"Bem-vindo","ordem":1,"visivel":true},
    {"tipo":"novidades","titulo":"Novidades","ordem":2,"visivel":true,"modo_exibicao":"lista","limite_itens":5},
    {"tipo":"ferramentas","titulo":"Ferramentas","ordem":3,"visivel":true,"modo_exibicao":"grid","limite_itens":8},
    {"tipo":"aulas","titulo":"Aulas","ordem":4,"visivel":true,"modo_exibicao":"carrossel","limite_itens":6}
  ]
}'::jsonb WHERE slug = 'sptech-demo';
