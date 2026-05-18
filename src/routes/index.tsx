import { createFileRoute, Link } from "@tanstack/react-router";
import { SptechLogo } from "@/components/SptechLogo";
import {
  Wrench,
  Newspaper,
  GraduationCap,
  BookOpen,
  Sparkles,
  Palette,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPTech — Plataforma white-label de aprendizagem" },
      {
        name: "description",
        content:
          "Plataforma multiambiente para escolas e programas: cada ambiente com sua marca, ferramentas de IA, novidades, aulas, playbook e mural público de resultados.",
      },
      { property: "og:title", content: "SPTech — Plataforma white-label de aprendizagem" },
      {
        property: "og:description",
        content:
          "Multiambiente, white-label e seguro. Ferramentas, Novidades, Aulas, Playbook e Mural de Resultados — um ambiente por marca, turma ou comunidade.",
      },
    ],
  }),
  component: Index,
});

const PILARES = [
  {
    icon: Wrench,
    titulo: "Ferramentas",
    desc: "Curadoria de IAs e apps liberados por ambiente, com destaque e categorias.",
  },
  {
    icon: Newspaper,
    titulo: "Novidades",
    desc: "Conteúdos e novidades do mundo da IA publicados por turma ou marca.",
  },
  {
    icon: GraduationCap,
    titulo: "Aulas",
    desc: "Player com progresso, próxima aula sugerida e comentários moderados.",
  },
  {
    icon: BookOpen,
    titulo: "Playbook",
    desc: "Materiais complementares de cada aula prontos para download.",
  },
  {
    icon: Sparkles,
    titulo: "Mural de Resultados",
    desc: "Vitrine pública dos trabalhos dos alunos, acessada por código do ambiente.",
  },
  {
    icon: Palette,
    titulo: "White-label real",
    desc: "Cada ambiente com cores, logo, layout e efeitos próprios — sem mexer em código.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-secondary">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <SptechLogo />
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/aluno/entrar"
              className="hidden sm:inline-flex rounded-md px-3 py-2 text-secondary hover:bg-muted"
            >
              Sou aluno
            </Link>
            <Link
              to="/admin/entrar"
              className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground font-semibold hover:opacity-90"
            >
              Entrar como Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 80% 0%, rgba(237,20,91,0.10), transparent 60%), radial-gradient(50% 40% at 0% 20%, rgba(99,177,188,0.12), transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-6xl px-6 pt-20 pb-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Plataforma multiambiente
            </span>
            <h1 className="mt-5 text-5xl sm:text-6xl font-black leading-[0.95] tracking-tight max-w-3xl">
              Um ambiente para cada{" "}
              <span className="text-primary">marca, turma ou comunidade.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              A SPTech entrega uma área do aluno white-label de verdade: cada ambiente com
              suas cores, logo e identidade. Ferramentas de IA, novidades, aulas, playbook
              e um mural público para mostrar os resultados dos alunos.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/admin/entrar"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Entrar como Admin <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/aluno/entrar"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted"
              >
                Sou aluno
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Tem um <strong className="text-secondary">código de acesso aos resultados</strong>?
              Use o link enviado pela sua escola — cada ambiente possui um endereço próprio
              do tipo <code className="rounded bg-muted px-1.5 py-0.5">/e/sua-escola/resultados</code>.
            </p>
          </div>
        </section>

        {/* Pilares */}
        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-2xl">
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
                O que a plataforma faz
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black">
                Cinco pilares na área do aluno, um painel para a coordenação.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Tudo curado pelos professores, segmentado por ambiente, com permissões granulares
                e RLS ativo em todas as tabelas.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PILARES.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.titulo}
                    className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 font-bold text-lg leading-tight">{p.titulo}</div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 grid gap-12 md:grid-cols-2 items-start">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
                Como funciona
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black">
                Do cadastro do ambiente ao aluno na primeira aula.
              </h2>
              <ol className="mt-6 space-y-5">
                {[
                  {
                    n: "01",
                    t: "Crie o ambiente",
                    d: "Defina marca, cores, layout e o código público do Mural de Resultados.",
                  },
                  {
                    n: "02",
                    t: "Cure conteúdo",
                    d: "Vincule ferramentas, novidades, cursos/aulas e trabalhos por ambiente.",
                  },
                  {
                    n: "03",
                    t: "Convide os alunos",
                    d: "Importação em planilha ou convite individual; senha forte e recuperação por e-mail.",
                  },
                  {
                    n: "04",
                    t: "Acompanhe",
                    d: "Métricas de acesso, progresso de vídeo, comentários e logs auditáveis.",
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <div className="text-2xl font-black text-primary leading-none">{s.n}</div>
                    <div>
                      <div className="font-bold">{s.t}</div>
                      <div className="text-sm text-muted-foreground">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Pronto para produção
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { i: ShieldCheck, t: "RLS em todas as tabelas + RBAC por ambiente" },
                  { i: Users, t: "Multiambiente real — um domínio lógico por escola/turma" },
                  { i: Sparkles, t: "Mural público de resultados gated por código" },
                  { i: Palette, t: "White-label nativo: cores, logo, layout e efeitos" },
                  { i: BookOpen, t: "Playbook: materiais de aula prontos para download" },
                ].map(({ i: Icon, t }) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-2">
                <Link
                  to="/admin/entrar"
                  className="inline-flex justify-center rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90"
                >
                  Acessar painel administrativo
                </Link>
                <Link
                  to="/aluno/entrar"
                  className="inline-flex justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Entrar como aluno
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© SPTech — São Paulo Tech School</div>
          <div className="flex gap-4">
            <Link to="/admin/entrar" className="hover:text-secondary">Admin</Link>
            <Link to="/aluno/entrar" className="hover:text-secondary">Aluno</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
