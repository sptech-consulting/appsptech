import { supabase } from "@/integrations/supabase/client";

export type AdminProfile = {
  id: string;
  nome: string;
  email: string;
};

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getAdminProfile(): Promise<AdminProfile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("usuarios_admin")
    .select("id, nome, email")
    .eq("auth_user_id", u.user.id)
    .maybeSingle();
  return data ?? null;
}

export async function getAlunoProfile() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("alunos")
    .select("id, nome_completo, email_acesso")
    .eq("auth_user_id", u.user.id)
    .maybeSingle();
  return data ?? null;
}
