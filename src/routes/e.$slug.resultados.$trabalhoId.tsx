import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { obterTrabalhoPublico, registrarVisualizacaoTrabalho } from "@/lib/trabalhos.functions";
import { ApresentacaoBlock } from "@/components/ApresentacaoBlock";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/e/$slug/resultados/$trabalhoId")({
  validateSearch: (s: Record<string, unknown>) => ({
    codigo: typeof s.codigo === "string" ? s.codigo : undefined,
  }),
  component: TrabalhoDetalhe,
});

function TrabalhoDetalhe() {
  const { slug, trabalhoId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const obter = useServerFn(obterTrabalhoPublico);
  const registrar = useServerFn(registrarVisualizacaoTrabalho);
  const [t, setT] = useState<Awaited<ReturnType<typeof obterTrabalhoPublico>> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let codigo = sessionStorage.getItem(`resultados:${slug}:codigo`);
    if (search.codigo) {
      codigo = search.codigo.toUpperCase().replace(/\s+/g, "");
      sessionStorage.setItem(`resultados:${slug}:codigo`, codigo!);
    }
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
  }, [slug, trabalhoId, navigate, obter, registrar, search.codigo]);

  if (erro)
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{erro}</p>
          <Link
            to="/e/$slug/resultados"
            params={{ slug }}
            className="mt-3 inline-block text-sm text-primary underline"
          >
            Voltar ao mural
          </Link>
        </div>
      </main>
    );

  if (!t)
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </main>
    );

  // Cores: o RPC só devolve nome/slug do ambiente; usamos tokens padrão SPTech.
  const primaria = "var(--primary)";

  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 pt-6 pb-4 flex items-center justify-between gap-4">
          <Link
            to="/e/$slug/resultados"
            params={{ slug }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-secondary"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar ao mural
          </Link>
          <Link
            to="/e/$slug"
            params={{ slug }}
            className="text-xs font-semibold text-muted-foreground hover:text-secondary"
          >
            Área do aluno →
          </Link>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-10 grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
              {t.ambiente_nome}
            </div>
            <h1 className="mt-2 text-4xl md:text-5xl font-black leading-tight text-secondary">
              {t.titulo}
            </h1>
            {t.subtitulo && (
              <p className="mt-3 text-lg text-secondary/80 leading-relaxed">{t.subtitulo}</p>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Por <strong className="text-secondary">{t.autor_nome}</strong>
              {t.turma ? ` · ${t.turma}` : ""}
            </div>
            {t.tags && t.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {t.link_externo && (
              <a
                href={t.link_externo}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:scale-105 transition"
              >
                Abrir trabalho <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {t.imagem_capa_url && (
            <div
              className="aspect-video w-full rounded-2xl shadow-2xl bg-muted"
              style={{
                backgroundImage: `url(${t.imagem_capa_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
        </div>
      </section>

      {/* RESUMO / DESCRIÇÃO */}
      {(t.resumo || t.conteudo) && (
        <section className="mx-auto max-w-3xl px-6 py-12">
          {t.resumo && (
            <p className="text-lg leading-relaxed text-secondary/90">{t.resumo}</p>
          )}
          {t.conteudo && (
            <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-secondary/80">
              {t.conteudo}
            </div>
          )}
        </section>
      )}

      {/* APRESENTAÇÃO */}
      {(t.apresentacao_url || t.apresentacao_imagem_url) && (
        <section className="mx-auto max-w-5xl px-6 py-10">
          {t.apresentacao_titulo && (
            <div className="text-center mb-6">
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
                Apresentação
              </div>
              <h2 className="mt-1 text-2xl font-black text-secondary">
                {t.apresentacao_titulo}
              </h2>
              {t.apresentacao_descricao && (
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                  {t.apresentacao_descricao}
                </p>
              )}
            </div>
          )}
          <ApresentacaoBlock
            tipo={t.apresentacao_tipo}
            url={t.apresentacao_url}
            imagemFallback={t.apresentacao_imagem_url}
          />
        </section>
      )}

      {/* FUNCIONALIDADES (zigzag) */}
      {t.funcionalidades.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="text-center mb-10">
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
              Principais funcionalidades
            </div>
            <h2 className="mt-1 text-3xl font-black text-secondary">O que entregamos</h2>
          </div>
          <div className="space-y-12">
            {t.funcionalidades.map((f, i) => (
              <div
                key={f.id}
                className={`grid gap-8 items-center md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div className="text-5xl font-black text-primary/20 leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-secondary">{f.titulo}</h3>
                  {f.descricao && (
                    <p className="mt-3 text-base leading-relaxed text-secondary/80">
                      {f.descricao}
                    </p>
                  )}
                </div>
                <div
                  className="aspect-video w-full rounded-2xl bg-muted shadow-lg"
                  style={
                    f.imagem_url
                      ? {
                          backgroundImage: `url(${f.imagem_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* APLICAÇÃO E EXPECTATIVA */}
      {t.aplicacao_expectativa && (
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
              Onde se aplica e expectativa
            </div>
            <div className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-secondary/85">
              {t.aplicacao_expectativa}
            </div>
          </div>
        </section>
      )}

      {/* LINKS ÚTEIS */}
      {t.links.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-secondary">Links úteis</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/40 transition"
              >
                {l.icone_url ? (
                  <img src={l.icone_url} alt="" className="h-8 w-8 rounded" />
                ) : (
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                )}
                <span className="text-sm font-semibold text-secondary flex-1 truncate">
                  {l.rotulo}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
