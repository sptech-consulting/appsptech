import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminProfile, signOut, type AdminProfile } from "@/lib/auth";
import { SptechLogo } from "@/components/SptechLogo";
import { Toaster } from "@/components/ui/sonner";
import {
  LayoutDashboard,
  Layers,
  Wrench,
  Newspaper,
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  LogOut,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    // getSession() lê do localStorage — não faz chamada de rede,
    // evitando race condition e falsos negativos em re-runs do guard.
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminShell,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/ambientes", label: "Ambientes", icon: Layers },
  { to: "/admin/alunos", label: "Alunos", icon: Users },
  { to: "/admin/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/admin/novidades", label: "Novidades", icon: Newspaper },
  { to: "/admin/cursos", label: "Cursos", icon: BookOpen },
  { to: "/admin/aulas", label: "Aulas", icon: GraduationCap },
  { to: "/admin/usuarios", label: "Usuários admin", icon: Users },
  { to: "/admin/grupos", label: "Grupos & permissões", icon: Shield },
];

const NAV_DISABLED: { label: string; icon: typeof Shield; hint: string }[] = [];

function AdminShell() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-black text-secondary">Sem acesso administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu usuário não está vinculado a nenhum grupo administrativo. Peça a um Super Admin para liberar seu acesso.
          </p>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login" });
            }}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-5 border-b border-border">
          <SptechLogo />
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Área administrativa
          </div>
        </div>
        <nav className="p-3 flex flex-col gap-0.5 text-sm flex-1">
          {NAV.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                activeOptions={{ exact: !!it.exact }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-secondary hover:bg-muted [&.active]:bg-primary [&.active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
          <div className="my-2 border-t border-border" />
          {NAV_DISABLED.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.label}
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-muted-foreground/70 cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {it.label}
                </span>
                <span className="text-[10px] uppercase tracking-wider">{it.hint}</span>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border text-xs">
          <div className="font-semibold text-secondary">{profile.nome}</div>
          <div className="text-muted-foreground truncate">{profile.email}</div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
          >
            <LogOut className="h-3 w-3" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
