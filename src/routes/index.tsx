import { createFileRoute, Link } from "@tanstack/react-router";
import { SptechLogo } from "@/components/SptechLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPTech — Plataforma Multiambiente" },
      { name: "description", content: "Plataforma white-label SPTech para ambientes corporativos e educacionais." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <SptechLogo />
          <nav className="flex gap-3 text-sm">
            <Link to="/admin/login" className="rounded-md px-3 py-2 text-secondary hover:bg-muted">Acesso Admin</Link>
            <Link to="/aluno/login" className="rounded-md bg-primary px-3 py-2 text-primary-foreground font-semibold hover:opacity-90">Acesso do Aluno</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div>
            <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              Plataforma Multiambiente
            </span>
            <h1 className="mt-4 text-5xl font-black text-secondary leading-tight">
              Um ambiente para cada<br />
              <span className="text-primary">marca, turma ou comunidade.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              White-label completo: cada ambiente tem cores, logo, layout e cards próprios.
              Ferramentas, novidades, aulas e alunos organizados por contexto.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/admin/login" className="rounded-md bg-secondary px-5 py-3 text-secondary-foreground font-semibold hover:opacity-90">
                Entrar como Admin
              </Link>
              <Link to="/aluno/login" className="rounded-md border border-border bg-card px-5 py-3 font-semibold hover:bg-muted">
                Sou Aluno
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status do Sistema — Fase 1</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Banco de dados estruturado (18 tabelas)",
                "RLS ativo em todas as tabelas",
                "RBAC com escopo global ou por ambiente",
                "Auth e-mail + senha (admin e aluno)",
                "Ambientes mockados: Ecorodovias e SPTech Demo",
                "Permissões iniciais cadastradas",
              ].map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-secondary">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-20">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          © SPTech — São Paulo Tech School
        </div>
      </footer>
    </div>
  );
}
