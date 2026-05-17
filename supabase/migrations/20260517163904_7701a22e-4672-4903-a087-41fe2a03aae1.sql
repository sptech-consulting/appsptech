
GRANT EXECUTE ON FUNCTION public.is_any_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_for_ambiente(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aluno_tem_ambiente(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_aluno_id() TO authenticated;
