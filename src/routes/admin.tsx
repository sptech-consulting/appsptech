import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminProfile, signOut, type AdminProfile } from "@/lib/auth";
import { SptechLogo } from "@/components/SptechLogo";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
  },
  component: AdminShell,
});

function AdminShell() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminProfile().then((p) => { setProfile(p); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-black text-secondary">Sem acesso administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu usuário não está vinculado a nenhum grupo administrativo. Peça a um Super Admin para liberar seu acesso.
          </p>
          <button onClick={async () => { await signOut(); navigate({ to: "/admin/login" }); }}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted">
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <div className="p-5 border-b border-border"><SptechLogo /></div>
        <nav className="p-3 flex flex-col gap-1 text-sm flex-1">
          {[
            { to: "/admin", label: "Dashboard" },
            { to: "/admin", label: "Ambientes" },
          ].map((it, i) => (
            <Link key={i} to={it.to}
              className="rounded-md px-3 py-2 text-secondary hover:bg-muted [&.active]:bg-primary [&.active]:text-primary-foreground"
              activeOptions={{ exact: true }}>
              {it.label}
            </Link>
          ))}
          <div className="mt-2 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Fases 2–5 em breve
          </div>
        </nav>
        <div className="p-3 border-t border-border text-xs">
          <div className="font-semibold text-secondary">{profile.nome}</div>
          <div className="text-muted-foreground truncate">{profile.email}</div>
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="mt-2 text-primary hover:underline">Sair</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}
