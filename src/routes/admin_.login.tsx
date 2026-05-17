import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SptechLogo } from "@/components/SptechLogo";

export const Route = createFileRoute("/admin_/login")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/admin" });
  },
  head: () => ({ meta: [{ title: "Login Admin — SPTech" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        await signIn(email, password);
        // Tenta reivindicar super admin (primeiro signup)
        const { error: rpcErr } = await supabase.rpc("claim_super_admin", { _nome: nome || email });
        if (rpcErr && !rpcErr.message.includes("Já existe")) {
          setInfo("Conta criada. Aguarde um admin existente vincular você a um grupo de acesso.");
          setLoading(false);
          return;
        }
      } else {
        await signIn(email, password);
      }
      // Hard redirect garante hidratação limpa da sessão no /admin
      window.location.assign("/admin");
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
          <h1 className="text-2xl font-black text-secondary">Área Administrativa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Acesse com seu e-mail e senha." : "Crie sua conta administrativa."}
          </p>

          <form onSubmit={handle} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-secondary">Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
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
            {info && <div className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">{info}</div>}

            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-secondary">
            {mode === "signin" ? "Primeiro acesso? Criar conta admin" : "Já tenho conta — entrar"}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          O primeiro usuário a se cadastrar vira Super Admin automaticamente.
        </p>
      </div>
    </div>
  );
}
