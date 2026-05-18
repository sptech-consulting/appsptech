import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getFerramentaDetalhe, type FerramentaDetalhe } from "@/lib/ferramenta.functions";
import { getAmbienteBranding } from "@/lib/ambiente.functions";
import { ArrowLeft, ExternalLink, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/e/$slug/ferramenta/$ferramentaId")({
  beforeLoad: async ({ params }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/e/$slug/login", params: { slug: params.slug } });
    }
  },
  component: FerramentaPage,
});

function FerramentaPage() {
  const { slug, ferramentaId } = Route.useParams();
  const fetchDetalhe = useServerFn(getFerramentaDetalhe);
  const fetchBranding = useServerFn(getAmbienteBranding);
  const [f, setF] = useState<FerramentaDetalhe | null>(null);
  const [branding, setBranding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [funcAberta, setFuncAberta] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, b] = await Promise.all([
          fetchDetalhe({ data: { slug, ferramentaId } }),
          fetchBranding({ data: { slug } }),
        ]);
        setF(d);
        setBranding(b);
        if (d.funcionalidades.length > 0) setFuncAberta(d.funcionalidades[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, [slug, ferramentaId, fetchDetalhe, fetchBranding]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-black text-secondary">Ferramenta não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link to="/e/$slug" params={{ slug }} className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </div>
    );
  }
  if (!f) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  const cor_fundo = branding?.cor_fundo ?? "#FFFFFF";
  const cor_texto = branding?.cor_texto ?? "#1F2A44";
  const cor_primaria = branding?.cor_primaria ?? "#ED145B";
  const cor_botao = branding?.cor_botao ?? cor_primaria;
  const cor_card = branding?.cor_card ?? "#FFFFFF";
  const cor_borda = branding?.cor_borda ?? "#D0D3D4";

  const inputs = f.tags.filter((t) => t.tipo === "input");
  const outputs = f.tags.filter((t) => t.tipo === "output");
  const integracoes = f.tags.filter((t) => t.tipo === "integracao");
  const funcAtiva = f.funcionalidades.find((fn) => fn.id === funcAberta) ?? f.funcionalidades[0];

  const cardCls = "rounded-2xl border p-5";
  const cardStyle = { backgroundColor: cor_card, borderColor: cor_borda };
  const tagCls = "inline-flex items-center rounded-full text-xs font-semibold px-3 py-1";
  const tagStyle = { backgroundColor: cor_primaria + "1f", color: cor_primaria };

  return (
    <div className="min-h-screen" style={{ backgroundColor: cor_fundo, color: cor_texto }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/e/$slug" params={{ slug }} className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 hover:underline" style={{ color: cor_primaria }}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {/* HERO */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {f.icone_url && <img src={f.icone_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
              <h1 className="text-3xl sm:text-4xl font-black">{f.nome}</h1>
            </div>
            {f.subtitulo && <p className="text-lg opacity-80 mb-6">{f.subtitulo}</p>}
            {f.url && (
              <a href={f.url} target={f.tipo_abertura === "mesma_aba" ? "_self" : "_blank"} rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: cor_botao }}>
                Acesse aqui <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {f.imagem_capa_url && (
            <img src={f.imagem_capa_url} alt={f.nome} className="w-full rounded-2xl object-cover aspect-video" />
          )}
        </div>

        {/* BLOCOS / TAGS / CASOS DE USO */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {f.casos_uso.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h3 className="font-bold mb-3">Casos de Uso</h3>
              <ul className="space-y-1.5 text-sm opacity-90">
                {f.casos_uso.map((c) => (<li key={c.id}>• {c.texto}</li>))}
              </ul>
            </div>
          )}
          {inputs.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h3 className="font-bold mb-3">Formas de Input</h3>
              <div className="flex flex-wrap gap-2">{inputs.map((t) => <span key={t.id} className={tagCls} style={tagStyle}>{t.rotulo}</span>)}</div>
            </div>
          )}
          {outputs.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h3 className="font-bold mb-3">Formas de Output</h3>
              <div className="flex flex-wrap gap-2">{outputs.map((t) => <span key={t.id} className={tagCls} style={tagStyle}>{t.rotulo}</span>)}</div>
            </div>
          )}
          {integracoes.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h3 className="font-bold mb-3">Integrações</h3>
              <div className="flex flex-wrap gap-2">{integracoes.map((t) => <span key={t.id} className={tagCls} style={tagStyle}>{t.rotulo}</span>)}</div>
            </div>
          )}
          {f.blocos.map((b) => (
            <div key={b.id} className={cardCls} style={cardStyle}>
              <h3 className="font-bold mb-2">{b.titulo}</h3>
              <p className="text-sm opacity-80 whitespace-pre-wrap">{b.conteudo}</p>
            </div>
          ))}
          {f.frase_destaque && (
            <div className="rounded-2xl px-5 py-6 text-center font-black uppercase tracking-wide text-sm md:col-span-3"
              style={{ backgroundColor: cor_primaria, color: "#fff" }}>
              {f.frase_destaque}
            </div>
          )}
        </div>

        {/* FUNCIONALIDADES */}
        {f.funcionalidades.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Funcionalidades da Ferramenta</h2>
            <div className="rounded-2xl border p-5 grid md:grid-cols-2 gap-6" style={cardStyle}>
              <div className="space-y-2">
                {f.funcionalidades.map((fn) => {
                  const aberta = fn.id === funcAberta;
                  return (
                    <div key={fn.id} className="rounded-xl border" style={{ borderColor: cor_borda }}>
                      <button onClick={() => setFuncAberta(aberta ? null : fn.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left">
                        <span className="font-semibold text-sm flex items-center gap-2">
                          {aberta ? <Minus className="h-4 w-4" style={{ color: cor_primaria }} /> : <Plus className="h-4 w-4" style={{ color: cor_primaria }} />}
                          {fn.titulo}
                        </span>
                      </button>
                      {aberta && fn.descricao && (
                        <p className="px-4 pb-4 text-xs opacity-80 whitespace-pre-wrap">{fn.descricao}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div>
                {funcAtiva?.imagem_url ? (
                  <img src={funcAtiva.imagem_url} alt={funcAtiva.titulo} className="w-full rounded-xl object-cover aspect-video" />
                ) : (
                  <div className="w-full aspect-video rounded-xl border-2 border-dashed flex items-center justify-center text-xs opacity-50" style={{ borderColor: cor_borda }}>
                    Sem imagem
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CASOS DE TESTE */}
        {f.casos_teste.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Casos de Teste</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {f.casos_teste.map((c) => (
                <div key={c.id} className={cardCls} style={cardStyle}>
                  <h3 className="font-bold text-sm mb-2">{c.titulo}</h3>
                  {c.badge && (
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">{c.badge}</div>
                  )}
                  {c.prompt_exemplo && (
                    <div className="border-l-2 pl-3 text-sm font-semibold mb-3" style={{ borderColor: cor_primaria }}>
                      {c.prompt_exemplo}
                    </div>
                  )}
                  {c.explicacao && <p className="text-xs opacity-75 whitespace-pre-wrap">{c.explicacao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
