import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listarTrabalhosPublicos, resolverAmbientePorCodigo } from "@/lib/trabalhos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/e/$slug/resultados/")({
  component: ResultadosPage,
});

type Trabalho = Awaited<ReturnType<typeof listarTrabalhosPublicos>>[number];
type Amb = Awaited<ReturnType<typeof resolverAmbientePorCodigo>>;

function ResultadosPage() {
  const { slug } = Route.useParams();
  const resolver = useServerFn(resolverAmbientePorCodigo);
  const listar = useServerFn(listarTrabalhosPublicos);
  const [codigo, setCodigo] = useState("");
  const [amb, setAmb] = useState<Amb | null>(null);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(`resultados:${slug}:codigo`);
    if (saved) {
      setCodigo(saved);
      void entrar(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function entrar(c: string) {
    setLoading(true);
    try {
      const a = await resolver({ data: { codigo: c } });
      if (a.slug !== slug) throw new Error("Este código não corresponde a este ambiente.");
      const list = await listar({ data: { codigo: c } });
      setAmb(a);
      setTrabalhos(list);
      sessionStorage.setItem(`resultados:${slug}:codigo`, c.toUpperCase());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao validar código.");
    } finally {
      setLoading(false);
    }
  }

  const tk = {
    primaria: amb?.cor_primaria ?? "#ED145B",
    secundaria: amb?.cor_secundaria ?? "#1F2A44",
    fundo: amb?.cor_fundo ?? "#FFFFFF",
    texto: amb?.cor_texto ?? "#1F2A44",
  };

  if (!amb) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.trim()) void entrar(codigo.trim());
          }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg space-y-4"
        >
          <h1 className="text-2xl font-black text-secondary">Mural de Resultados</h1>
          <p className="text-sm text-muted-foreground">
            Informe o código de acesso compartilhado pelo seu professor para abrir o mural de trabalhos.
          </p>
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            placeholder="Ex.: SPT2026"
            className="font-mono text-lg tracking-widest uppercase text-center"
            autoFocus
          />
          <Button type="submit" disabled={loading || !codigo.trim()} className="w-full">
            {loading ? "Validando…" : "Entrar"}
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: tk.fundo, color: tk.texto }}>
      <header
        className="px-6 py-6 border-b"
        style={{ borderColor: "rgba(0,0,0,0.08)", backgroundImage: `linear-gradient(135deg, ${tk.primaria}11, transparent)` }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {amb.logo_url && <img src={amb.logo_url} alt={amb.nome} className="h-8 w-auto" />}
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: tk.primaria }}>
                Mural de Resultados
              </div>
              <h1 className="text-xl font-black">{amb.nome}</h1>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem(`resultados:${slug}:codigo`);
              setAmb(null);
              setCodigo("");
              setTrabalhos([]);
            }}
            className="text-xs font-semibold underline opacity-70 hover:opacity-100"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {trabalhos.length === 0 ? (
          <div className="text-center py-16 text-sm opacity-70">
            Ainda não há trabalhos publicados neste mural.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trabalhos.map((t) => (
              <Link
                key={t.id}
                to="/e/$slug/resultados/$trabalhoId"
                params={{ slug, trabalhoId: t.slug ?? t.id }}
                className="group rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-xl transition"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                <div
                  className="aspect-video bg-muted"
                  style={{
                    backgroundImage: t.imagem_capa_url
                      ? `url(${t.imagem_capa_url})`
                      : `linear-gradient(135deg, ${tk.primaria}, ${tk.secundaria})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="p-4">
                  {t.destaque && (
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
                      style={{ backgroundColor: `${tk.primaria}22`, color: tk.primaria }}
                    >
                      ⭐ Destaque
                    </span>
                  )}
                  <h3 className="font-bold leading-tight group-hover:underline" style={{ color: tk.secundaria }}>
                    {t.titulo}
                  </h3>
                  <div className="mt-1 text-xs opacity-70">
                    {t.autor_nome}
                    {t.turma ? ` · ${t.turma}` : ""}
                  </div>
                  {t.resumo && <p className="mt-2 text-sm opacity-80 line-clamp-3">{t.resumo}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
