import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/aluno")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/aluno/entrar" });

    // Sessão pode pertencer a um admin logado no mesmo navegador.
    // Liberamos a área se o auth_user_id estiver vinculado a um aluno ativo,
    // OU se houver um aluno ativo cadastrado com o mesmo e-mail (vínculo
    // pendente que será resolvido automaticamente pelo serverFn da página).
    const userId = data.session.user.id;
    const email = data.session.user.email?.toLowerCase() ?? null;

    const { data: porAuth } = await supabase
      .from("alunos")
      .select("id")
      .eq("auth_user_id", userId)
      .eq("status", "ativo")
      .maybeSingle();
    if (porAuth) return;

    if (email) {
      const { data: porEmail } = await supabase
        .from("alunos")
        .select("id")
        .ilike("email_acesso", email)
        .eq("status", "ativo")
        .maybeSingle();
      if (porEmail) return;
    }

    throw redirect({ to: "/aluno/entrar" });
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
