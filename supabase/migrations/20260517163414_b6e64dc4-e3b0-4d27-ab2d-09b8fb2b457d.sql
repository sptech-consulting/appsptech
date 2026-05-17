
-- 1) Bucket plataforma: remover SELECT amplo (listagem). Arquivos continuam acessíveis via URL pública (bucket público).
DROP POLICY IF EXISTS "plataforma publica leitura" ON storage.objects;

-- 2) Revogar EXECUTE de anon nas funções SECURITY DEFINER. Manter para authenticated apenas onde necessário.
REVOKE EXECUTE ON FUNCTION public.is_any_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_aluno_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_admin_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_for_ambiente(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.aluno_tem_ambiente(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_super_admin(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.link_aluno_auth() FROM anon, public, authenticated;

-- Funções auxiliares que rodam dentro de RLS não precisam ser chamáveis diretamente por authenticated via RPC.
REVOKE EXECUTE ON FUNCTION public.is_any_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_for_ambiente(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.aluno_tem_ambiente(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.current_admin_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.current_aluno_id() FROM authenticated;

-- claim_super_admin precisa ser chamável pelo primeiro usuário autenticado (bootstrap)
GRANT EXECUTE ON FUNCTION public.claim_super_admin(text) TO authenticated;
