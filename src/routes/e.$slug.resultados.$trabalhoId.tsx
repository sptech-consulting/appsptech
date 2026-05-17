import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { obterTrabalhoPublico, registrarVisualizacaoTrabalho } from "@/lib/trabalhos.functions";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/e/$slug/resultados/$trabalhoId")({
  component: TrabalhoDetalhe,
});

function TrabalhoDetalhe() {
  const { slug, trabalhoId } = Route.useParams();
  const navigate = useNavigate();
  const obter = useServerFn(obterTrabalhoPublico);
  const registrar = useServerFn(registrarVisualizacaoTrabalho);
  const [t, setT] = useState<Awaited<ReturnType<typeof obterTrabalhoPublico>> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const codigo = sessionStorage.getItem(`resultados:${slug}:codigo`);
    if (!codigo) {
      void navigate({ to: "/e/$slug/resultados", params: { slug } });
      return;
    }
    obter({ data: { codigo, trabalhoId } })
      .then((res) => {
        setT(res);
        void registrar({ data: { codigo, trabalhoId } }).catch(() => {});
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro"));
  }, [slug, trabalhoId, navigate, obter, registrar]);

  if (erro)
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{erro}</p>
          <Link to="/e/$slug/resultados" params={{ slug }} className="mt-3 inline-block text-sm text-primary underline">
            Voltar ao mural
          </Link>
        </div>
      </main>
    );

  if (!t) return <main className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando…</main>;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/e/$slug/resultados"
          params={{ slug }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-secondary"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar ao mural
        </Link>

        <article className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
          {t.imagem_capa_url && (
            <div
              className="aspect-video"
              style={{ backgroundImage: `url(${t.imagem_capa_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
          )}
          <div className="p-8">
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">{t.ambiente_nome}</div>
            <h1 className="mt-1 text-3xl font-black text-secondary">{t.titulo}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              Por <strong className="text-secondary">{t.autor_nome}</strong>
              {t.turma ? ` · ${t.turma}` : ""}
            </div>

            {t.resumo && <p className="mt-6 text-base leading-relaxed text-secondary/90">{t.resumo}</p>}
            {t.conteudo && (
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-secondary/80">{t.conteudo}</div>
            )}

            {t.link_externo && (
              <a
                href={t.link_externo}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Abrir trabalho <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
