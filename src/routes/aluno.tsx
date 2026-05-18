import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/aluno")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/aluno/entrar" });

    // Sessão pode pertencer a um admin logado no mesmo navegador.
    // Só liberamos a área do aluno se o auth_user_id estiver vinculado a um aluno ativo.
    const { data: aluno } = await supabase
      .from("alunos")
      .select("id")
      .eq("auth_user_id", data.session.user.id)
      .eq("status", "ativo")
      .maybeSingle();
    if (!aluno) throw redirect({ to: "/aluno/entrar" });
  },
  component: AlunoShell,
});

function AlunoShell() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div className="font-black text-secondary">Área do Aluno</div>
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="text-sm text-primary hover:underline">Sair</button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
