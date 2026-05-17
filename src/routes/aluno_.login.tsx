import { createFileRoute, redirect, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SptechLogo } from "@/components/SptechLogo";

export const Route = createFileRoute("/aluno_/login")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/aluno" });
  },
  head: () => ({ meta: [{ title: "Acesso do Aluno — SPTech" }] }),
  component: AlunoLogin,
});

function AlunoLogin() {
  const router = useRouter();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        await signIn(email, password);
      } else {
        await signIn(email, password);
      }
      await router.invalidate();
      navigate({ to: "/aluno" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block mb-6"><SptechLogo /></Link>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-black text-secondary">Acesso do Aluno</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o e-mail cadastrado pelo seu admin.
          </p>
          <form onSubmit={handle} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar acesso"}
            </button>
          </form>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-secondary">
            {mode === "signin" ? "Primeiro acesso? Definir senha" : "Já tenho senha — entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
