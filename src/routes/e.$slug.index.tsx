import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { getAmbienteHome, type AmbienteHomeData, type FerramentaItem } from "@/lib/ambiente-home.functions";
import { EffectCard } from "@/components/EffectCard";
import { DEFAULT_EFFECTS, type AmbienteEffects } from "@/lib/ambiente-effects";
import { Wrench, Newspaper, GraduationCap, ExternalLink, PlayCircle, FileText, Link as LinkIcon, LogOut, Clock } from "lucide-react";

export const Route = createFileRoute("/e/$slug/")({
  beforeLoad: async ({ params }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/e/$slug/login", params: { slug: params.slug } });
  },
  component: AmbienteHome,
});

const RADII = {
  quadrado: "0px",
  levemente_arredondado: "6px",
  arredondado: "16px",
  pill: "9999px",
} as const;

const PAD = {
  compacto: "12px",
  medio: "18px",
  grande: "24px",
} as const;

function AmbienteHome() {
  const { slug } = Route.useParams();
  const fetchHome = useServerFn(getAmbienteHome);
  const [data, setData] = useState<AmbienteHomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchHome({ data: { slug } });
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar ambiente");
      }
    })();
  }, [slug, fetchHome]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-6 text-center">
        <div className="max-w-md rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-black text-secondary">Acesso indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={async () => {
              await signOut();
              window.location.assign(`/e/${slug}/login`);
            }}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Carregando…</div>;
  }

  const b = data.branding;
  const radius = RADII[b.card_borda];
  const padding = PAD[b.card_tamanho];
  const shadow = b.card_estilo === "sombra" || b.card_sombra ? "0 10px 24px -12px rgba(0,0,0,0.25)" : "none";
  const border = b.card_estilo === "borda" ? `1px solid ${b.cor_borda}` : "none";

  const effects: AmbienteEffects = {
    ...DEFAULT_EFFECTS,
    efeito_card_tilt_3d: b.efeito_card_tilt_3d,
    efeito_card_glow: b.efeito_card_glow,
    efeito_card_scale: b.efeito_card_scale,
    efeito_botao_lift: b.efeito_botao_lift,
    efeito_entrada_animada: b.efeito_entrada_animada,
    efeito_som_hover: b.efeito_som_hover,
    efeito_som_volume: b.efeito_som_volume,
    efeito_blobs_fundo: b.efeito_blobs_fundo,
  };

  const cardBase: React.CSSProperties = {
    backgroundColor: b.card_estilo === "imagem" ? "transparent" : b.cor_card,
    color: b.cor_texto,
    borderRadius: radius,
    padding,
    boxShadow: shadow,
    border,
    backgroundImage:
      b.card_estilo === "imagem"
        ? "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), linear-gradient(135deg, var(--cp), var(--cs))"
        : undefined,
  };

  const enterClass = effects.efeito_entrada_animada ? "fx-enter" : "";
  const btnLift = effects.efeito_botao_lift ? "fx-btn-lift" : "";

  function openFerramenta(f: FerramentaItem) {
    if (!f.url) return;
    if (f.tipo_abertura === "mesma_aba") {
      window.location.assign(f.url);
    } else {
      window.open(f.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={
        {
          backgroundColor: b.cor_fundo,
          color: b.cor_texto,
          ["--cp" as any]: b.cor_primaria,
          ["--cs" as any]: b.cor_secundaria,
          ["--blob-1" as any]: b.cor_primaria,
          ["--blob-2" as any]: b.cor_secundaria,
        } as React.CSSProperties
      }
    >
      {effects.efeito_blobs_fundo && <div className="fx-blobs" />}

      <header
        className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: b.cor_secundaria, color: "#fff" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {b.logo_url ? (
            <img src={b.logo_url} alt={b.nome} className="h-8 w-auto" />
          ) : (
            <div className="h-8 w-8 rounded" style={{ backgroundColor: b.cor_primaria }} />
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{b.nome}</div>
            <div className="text-[10px] opacity-70 truncate">Olá, {data.aluno.nome_completo}</div>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            window.location.assign(`/e/${slug}/login`);
          }}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 ${btnLift}`}
          style={{ backgroundColor: b.cor_botao, color: "#fff", borderRadius: radius }}
        >
          <LogOut className="h-3 w-3" /> Sair
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-10">
        {/* Banner */}
        <section
          className="rounded-2xl p-8 md:p-12 text-white overflow-hidden relative"
          style={{
            backgroundImage: b.imagem_capa_url
              ? `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.1)), url(${b.imagem_capa_url})`
              : `linear-gradient(135deg, ${b.cor_primaria}, ${b.cor_secundaria})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: radius,
          }}
        >
          <div className="text-[10px] uppercase tracking-widest opacity-80">Bem-vindo</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-black">{b.nome}</h1>
          {b.descricao && <p className="mt-2 max-w-2xl text-sm md:text-base opacity-90">{b.descricao}</p>}
        </section>

        {/* Ferramentas */}
        {data.ferramentas.length > 0 && (
          <SectionHeader title="Ferramentas" icon={<Wrench className="h-3.5 w-3.5" />} color={b.cor_secundaria}>
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${enterClass}`}>
              {data.ferramentas.map((f) => (
                <EffectCard
                  key={f.id}
                  effects={effects}
                  baseStyle={{ ...cardBase, cursor: f.url ? "pointer" : "default" }}
                  primaria={b.cor_primaria}
                  onClick={() => openFerramenta(f)}
                >
                  <div className="flex items-start gap-3">
                    {b.card_exibir_icone &&
                      (f.icone_url ? (
                        <img src={f.icone_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div
                          className="h-10 w-10 rounded flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: b.cor_primaria }}
                        >
                          <Wrench className="h-5 w-5" />
                        </div>
                      ))}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold truncate">{f.nome}</div>
                        {f.destaque && (
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: b.cor_primaria, color: "#fff" }}
                          >
                            Destaque
                          </span>
                        )}
                      </div>
                      {f.descricao && <div className="mt-0.5 text-xs opacity-70 line-clamp-2">{f.descricao}</div>}
                      {f.categoria && (
                        <div className="mt-2 inline-block text-[10px] uppercase tracking-wider opacity-60">
                          {f.categoria}
                        </div>
                      )}
                    </div>
                    {f.url && <ExternalLink className="h-3.5 w-3.5 opacity-50 shrink-0" />}
                  </div>
                </EffectCard>
              ))}
            </div>
          </SectionHeader>
        )}

        {/* Aulas */}
        {data.aulas.length > 0 && (
          <SectionHeader title="Aulas" icon={<GraduationCap className="h-3.5 w-3.5" />} color={b.cor_secundaria}>
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${enterClass}`}>
              {data.aulas.map((a) => {
                const link = a.video_url ?? a.material_url;
                return (
                  <EffectCard
                    key={a.id}
                    effects={effects}
                    baseStyle={{ ...cardBase, cursor: link ? "pointer" : "default" }}
                    primaria={b.cor_primaria}
                    onClick={() => link && window.open(link, "_blank", "noopener,noreferrer")}
                  >
                    {b.card_exibir_imagem && (
                      <div
                        className="mb-3 h-32 w-full rounded-md overflow-hidden flex items-center justify-center"
                        style={{
                          backgroundImage: a.thumbnail_url
                            ? `url(${a.thumbnail_url})`
                            : `linear-gradient(135deg, ${b.cor_primaria}, ${b.cor_secundaria})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: Math.min(parseInt(radius) || 0, 12) + "px",
                        }}
                      >
                        {!a.thumbnail_url && <PlayCircle className="h-10 w-10 text-white/80" />}
                      </div>
                    )}
                    {a.modulo && (
                      <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">{a.modulo}</div>
                    )}
                    <div className="font-bold leading-snug">{a.titulo}</div>
                    {a.descricao && <div className="mt-1 text-xs opacity-70 line-clamp-2">{a.descricao}</div>}
                    <div className="mt-2 flex items-center gap-3 text-[11px] opacity-70">
                      {a.duracao_minutos && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {a.duracao_minutos} min
                        </span>
                      )}
                      {a.tipo_conteudo && <span className="capitalize">{a.tipo_conteudo}</span>}
                      {a.material_url && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Material
                        </span>
                      )}
                    </div>
                  </EffectCard>
                );
              })}
            </div>
          </SectionHeader>
        )}

        {/* Novidades */}
        {data.novidades.length > 0 && (
          <SectionHeader title="Novidades" icon={<Newspaper className="h-3.5 w-3.5" />} color={b.cor_secundaria}>
            <div className={`grid gap-4 sm:grid-cols-2 ${enterClass}`}>
              {data.novidades.map((n) => (
                <EffectCard
                  key={n.id}
                  effects={effects}
                  baseStyle={{ ...cardBase, cursor: n.fonte_url ? "pointer" : "default" }}
                  primaria={b.cor_primaria}
                  onClick={() => n.fonte_url && window.open(n.fonte_url, "_blank", "noopener,noreferrer")}
                >
                  <div className="flex gap-4">
                    {b.card_exibir_imagem && (
                      <div
                        className="h-24 w-24 shrink-0 rounded-md overflow-hidden"
                        style={{
                          backgroundImage: n.imagem_url
                            ? `url(${n.imagem_url})`
                            : `linear-gradient(135deg, ${b.cor_primaria}, ${b.cor_secundaria})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: Math.min(parseInt(radius) || 0, 12) + "px",
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {n.categoria && (
                          <span className="text-[10px] uppercase tracking-wider opacity-60">{n.categoria}</span>
                        )}
                        {n.destaque && (
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: b.cor_primaria, color: "#fff" }}
                          >
                            Destaque
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-bold leading-snug line-clamp-2">{n.titulo}</div>
                      {n.resumo && <div className="mt-1 text-xs opacity-70 line-clamp-3">{n.resumo}</div>}
                      <div className="mt-2 flex items-center justify-between text-[11px] opacity-70">
                        <span>
                          {n.publicado_em
                            ? new Date(n.publicado_em).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                        {n.fonte_nome && (
                          <span className="inline-flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> {n.fonte_nome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </EffectCard>
              ))}
            </div>
          </SectionHeader>
        )}

        {data.ferramentas.length === 0 && data.novidades.length === 0 && data.aulas.length === 0 && (
          <div
            className="rounded-xl p-10 text-center opacity-80"
            style={{ border: `1px dashed ${b.cor_borda}` }}
          >
            <p className="text-sm">
              Nenhum conteúdo vinculado a este ambiente ainda. Volte em breve.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionHeader({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold"
        style={{ color }}
      >
        {icon} {title}
      </div>
      {children}
    </section>
  );
}
