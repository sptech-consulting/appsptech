import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listarLogsAuditoria, type AdminLogRow } from "@/lib/admin-comentarios.functions";
import { ScrollText, Search } from "lucide-react";

export const Route = createFileRoute("/admin/logs")({ component: AdminLogs });

function AdminLogs() {
  const fetchLogs = useServerFn(listarLogsAuditoria);
  const [rows, setRows] = useState<AdminLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchLogs({ data: { acao: acao || undefined, limit: 200 } });
      setRows(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <h1 className="text-3xl font-black text-secondary flex items-center gap-2">
        <ScrollText className="h-6 w-6" /> Logs de auditoria
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Histórico de ações administrativas e de alunos.</p>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={acao}
            onChange={(e) => setAcao(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="filtrar por ação (ex: comentario)"
            className="bg-transparent outline-none text-xs w-72"
          />
        </div>
        <button onClick={load} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground">
          Buscar
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum log encontrado.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Data</th>
                <th className="text-left px-4 py-2">Ação</th>
                <th className="text-left px-4 py-2">Entidade</th>
                <th className="text-left px-4 py-2">Ambiente</th>
                <th className="text-left px-4 py-2">Admin</th>
                <th className="text-left px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <>
                  <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.criado_em).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{r.acao}</td>
                    <td className="px-4 py-2 text-xs">{r.entidade ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">{r.ambiente_nome ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">{r.usuario_admin_nome ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {openId === r.id ? "fechar" : "detalhes"}
                      </button>
                    </td>
                  </tr>
                  {openId === r.id && (
                    <tr className="bg-muted/30">
                      <td colSpan={6} className="px-4 py-3">
                        <pre className="text-[11px] whitespace-pre-wrap break-all">
                          {JSON.stringify({ anteriores: r.dados_anteriores, novos: r.dados_novos, entidade_id: r.entidade_id }, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
