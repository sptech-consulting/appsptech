import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAlunoAreaAuth, type AlunoAreaAmbiente } from "@/lib/aluno-area.functions";

export const Route = createFileRoute("/aluno/")({
  component: AlunoHome,
});

function AlunoHome() {
  const fetchArea = useServerFn(getAlunoAreaAuth);
  const [ambientes, setAmbientes] = useState<AlunoAreaAmbiente[]>([]);
  const [profile, setProfile] = useState<{ nome_completo: string; email_acesso: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchArea({ data: {} as never });
        setProfile(res.aluno);
        setAmbientes(res.ambientes);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchArea]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : !profile ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-black text-secondary">Aluno não cadastrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu e-mail ainda não foi vinculado a um ambiente. Peça ao seu administrador para importar seu acesso.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-black text-secondary">Olá, {profile.nome_completo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Selecione um ambiente para entrar.</p>

          {ambientes.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Você ainda não está vinculado a nenhum ambiente ativo.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {ambientes.map((a) => (
                <Link
                  key={a.id}
                  to="/e/$slug"
                  params={{ slug: a.slug }}
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="h-24"
                    style={{
                      backgroundImage: a.imagem_capa_url
                        ? `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0)), url(${a.imagem_capa_url})`
                        : undefined,
                      backgroundColor: a.cor_primaria ?? "#ED145B",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="p-4">
                    <div className="font-bold text-secondary">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">/{a.slug}</div>
                    <div className="mt-3 inline-block rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                      Entrar →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
