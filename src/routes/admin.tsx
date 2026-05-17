import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  MessageSquare,
  ScrollText,
  BarChart3,
  ChevronDown,
  Sparkles,
  Settings,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminShell,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavGroup = { id: string; label: string; icon: typeof LayoutDashboard; items: NavItem[] };

const SOLO: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/metricas", label: "Métricas", icon: BarChart3 },
];

const GROUPS: NavGroup[] = [
  {
    id: "ambientes",
    label: "Ambientes e Turmas",
    icon: Layers,
    items: [
      { to: "/admin/ambientes", label: "Ambientes", icon: Layers },
      { to: "/admin/alunos", label: "Alunos", icon: Users },
      { to: "/admin/ferramentas", label: "Ferramentas", icon: Wrench },
      { to: "/admin/novidades", label: "Novidades", icon: Newspaper },
    ],
  },
  {
    id: "ead",
    label: "EAD",
    icon: GraduationCap,
    items: [
      { to: "/admin/cursos", label: "Cursos", icon: BookOpen },
      { to: "/admin/aulas", label: "Aulas", icon: GraduationCap },
      { to: "/admin/trabalhos", label: "Trabalhos (Mural)", icon: Sparkles },
    ],
  },
  {
    id: "monitoria",
    label: "Monitoria",
    icon: Eye,
    items: [
      { to: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
      { to: "/admin/logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    id: "config",
    label: "Configurações",
    icon: Settings,
    items: [
      { to: "/admin/usuarios", label: "Usuários Admin", icon: Users },
      { to: "/admin/grupos", label: "Grupos e Permissões", icon: Shield },
    ],
  },
];

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
        <AdminNav />

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
