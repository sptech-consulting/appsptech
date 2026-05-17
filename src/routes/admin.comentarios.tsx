import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listarComentariosAdmin, moderarComentario, type AdminComentarioRow } from "@/lib/admin-comentarios.functions";
import { ThumbsUp, EyeOff, RotateCcw, Trash2, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/comentarios")({ component: AdminComentarios });

function AdminComentarios() {
  const fetchList = useServerFn(listarComentariosAdmin);
  const fnMod = useServerFn(moderarComentario);
  const [rows, setRows] = useState<AdminComentarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ativo");
  const [busca, setBusca] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchList({ data: { status: status || undefined, busca: busca || undefined } });
      setRows(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const moderar = async (id: string, novoStatus: "ativo" | "oculto" | "removido") => {
    try {
      await fnMod({ data: { comentarioId: id, status: novoStatus } });
      toast.success(novoStatus === "ativo" ? "Comentário restaurado" : novoStatus === "oculto" ? "Comentário oculto" : "Comentário removido");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-secondary flex items-center gap-2">
            <MessageSquare className="h-6 w-6" /> Comentários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Modere comentários publicados pelos alunos.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["ativo", "oculto", "removido", ""] as const).map((s) => (
          <button
            key={s || "todos"}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
              status === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-secondary"
            }`}
          >
            {s === "" ? "Todos" : s === "ativo" ? "Ativos" : s === "oculto" ? "Ocultos" : "Removidos"}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Buscar..."
            className="bg-transparent outline-none text-xs w-40"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum comentário para este filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-bold text-secondary">{c.autor_nome}</span>
                    <span>·</span>
                    <span className="uppercase tracking-wider">{c.autor_tipo}</span>
                    <span>·</span>
                    <span>{new Date(c.criado_em).toLocaleString("pt-BR")}</span>
                    <span>·</span>
                    <span>
                      {c.ambiente_slug ? (
                        <Link to="/e/$slug/aula/$aulaId" params={{ slug: c.ambiente_slug, aulaId: c.aula_id }} className="hover:underline" target="_blank">
                          {c.ambiente_nome} / {c.aula_titulo}
                        </Link>
                      ) : (
                        `${c.ambiente_nome} / ${c.aula_titulo}`
                      )}
                    </span>
                    {c.parent_id && <span className="rounded bg-muted px-1.5 py-0.5">resposta</span>}
                    <span
                      className={`rounded px-1.5 py-0.5 font-semibold ${
                        c.status === "ativo"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.status === "oculto"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-secondary whitespace-pre-wrap">{c.conteudo}</p>
                  <div className="mt-2 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {c.curtidas}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {c.status !== "ativo" && (
                    <button
                      onClick={() => moderar(c.id, "ativo")}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border border-border hover:bg-muted"
                    >
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </button>
                  )}
                  {c.status !== "oculto" && (
                    <button
                      onClick={() => moderar(c.id, "oculto")}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border border-border hover:bg-muted"
                    >
                      <EyeOff className="h-3 w-3" /> Ocultar
                    </button>
                  )}
                  {c.status !== "removido" && (
                    <button
                      onClick={() => moderar(c.id, "removido")}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
