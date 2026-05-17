
-- Reivindica primeiro super admin (qualquer um pode chamar; só funciona uma vez)
CREATE OR REPLACE FUNCTION public.claim_super_admin(_nome TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _admin_id UUID;
  _grupo_id UUID;
  _email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios_admin) THEN
    RAISE EXCEPTION 'Já existe um administrador no sistema';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.usuarios_admin (auth_user_id, nome, email, status)
  VALUES (auth.uid(), _nome, _email, 'ativo')
  RETURNING id INTO _admin_id;

  SELECT id INTO _grupo_id FROM public.grupos_acesso WHERE nome = 'Super Admin' LIMIT 1;

  INSERT INTO public.usuarios_admin_grupos (usuario_admin_id, grupo_id, acesso_global)
  VALUES (_admin_id, _grupo_id, true);

  RETURN _admin_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_super_admin(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_super_admin(TEXT) TO authenticated;

-- Vincula aluno pré-cadastrado ao auth_user_id no signup
CREATE OR REPLACE FUNCTION public.link_aluno_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.alunos
  SET auth_user_id = NEW.id
  WHERE email_acesso = NEW.email AND auth_user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_aluno_auth();
