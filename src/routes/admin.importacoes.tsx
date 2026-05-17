import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, FileSpreadsheet, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

type Importacao = {
  id: string;
  ambiente_id: string;
  arquivo_nome: string | null;
  tipo_arquivo: "csv" | "xlsx" | null;
  status: "pendente" | "processando" | "concluido" | "concluido_com_erros" | "falhou";
  total_linhas: number | null;
  total_importados: number | null;
  total_atualizados: number | null;
  total_erros: number | null;
  criado_em: string;
  finalizado_em: string | null;
  ambientes?: { nome: string; slug: string } | null;
};

type Erro = {
  id: string;
  numero_linha: number | null;
  email_acesso: string | null;
  nome_completo: string | null;
  whatsapp: string | null;
  erro: string | null;
};

export const Route = createFileRoute("/admin/importacoes")({
  component: ImportacoesPage,
});

const STATUS_LABEL: Record<Importacao["status"], { label: string; cls: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", cls: "bg-zinc-100 text-zinc-700", icon: Clock },
  processando: { label: "Processando", cls: "bg-blue-100 text-blue-700", icon: Clock },
  concluido: { label: "Concluído", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  concluido_com_erros: { label: "Concluído c/ erros", cls: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  falhou: { label: "Falhou", cls: "bg-red-100 text-red-700", icon: AlertTriangle },
};

function ImportacoesPage() {
  const [items, setItems] = useState<Importacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Importacao | null>(null);
  const [erros, setErros] = useState<Erro[]>([]);
  const [loadingErros, setLoadingErros] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("importacoes_alunos")
      .select(
        "id,ambiente_id,arquivo_nome,tipo_arquivo,status,total_linhas,total_importados,total_atualizados,total_erros,criado_em,finalizado_em",
      )
      .order("criado_em", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    const rows = (data as any[]) ?? [];
    const ambIds = Array.from(new Set(rows.map((r) => r.ambiente_id).filter(Boolean)));
    let ambMap: Record<string, { nome: string; slug: string }> = {};
    if (ambIds.length > 0) {
      const { data: ambs } = await supabase
        .from("ambientes")
        .select("id,nome,slug")
        .in("id", ambIds);
      ambMap = Object.fromEntries((ambs ?? []).map((a) => [a.id, { nome: a.nome, slug: a.slug }]));
    }
    setItems(rows.map((r) => ({ ...r, ambientes: ambMap[r.ambiente_id] ?? null })) as Importacao[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function openErros(imp: Importacao) {
    setViewing(imp);
    setErros([]);
    setLoadingErros(true);
    const { data, error } = await supabase
      .from("importacoes_alunos_erros")
      .select("id,numero_linha,email_acesso,nome_completo,whatsapp,erro")
      .eq("importacao_id", imp.id)
      .order("numero_linha", { ascending: true });
    if (error) toast.error(error.message);
    setErros((data as any) ?? []);
    setLoadingErros(false);
  }

  function exportarErros() {
    if (erros.length === 0) return;
    const header = ["linha", "nome", "email", "whatsapp", "erro"];
    const rows = erros.map((e) => [
      e.numero_linha ?? "",
      e.nome_completo ?? "",
      e.email_acesso ?? "",
      e.whatsapp ?? "",
      (e.erro ?? "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `erros_importacao_${viewing?.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Histórico de importações"
        description="Cada importação de alunos por CSV/Excel fica registrada aqui com totais e linhas com erro."
        actions={
          <Link to="/admin/alunos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" /> Voltar para alunos
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma importação registrada.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Quando</th>
                <th className="px-4 py-3 font-semibold">Ambiente</th>
                <th className="px-4 py-3 font-semibold">Arquivo</th>
                <th className="px-4 py-3 font-semibold text-center">Linhas</th>
                <th className="px-4 py-3 font-semibold text-center">Importados</th>
                <th className="px-4 py-3 font-semibold text-center">Atualizados</th>
                <th className="px-4 py-3 font-semibold text-center">Erros</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const st = STATUS_LABEL[it.status];
                const Icon = st.icon;
                return (
                  <tr key={it.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(it.criado_em).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-secondary">
                      {it.ambientes?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        {it.arquivo_nome ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{it.total_linhas ?? 0}</td>
                    <td className="px-4 py-3 text-center text-emerald-700">
                      {it.total_importados ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-700">
                      {it.total_atualizados ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-700 font-semibold">
                      {it.total_erros ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}
                      >
                        <Icon className="h-3 w-3" />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={(it.total_erros ?? 0) === 0}
                        onClick={() => openErros(it)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ver erros
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Erros da importação · {viewing?.arquivo_nome ?? viewing?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {loadingErros ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : erros.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro registrado.</p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">
                  {erros.length} linha(s) com erro
                </span>
                <Button size="sm" variant="outline" onClick={exportarErros}>
                  Exportar CSV
                </Button>
              </div>
              <div className="max-h-96 overflow-auto border border-border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-secondary sticky top-0">
                    <tr className="text-left">
                      <th className="px-2 py-2 font-semibold">Linha</th>
                      <th className="px-2 py-2 font-semibold">Nome</th>
                      <th className="px-2 py-2 font-semibold">E-mail</th>
                      <th className="px-2 py-2 font-semibold">WhatsApp</th>
                      <th className="px-2 py-2 font-semibold">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {erros.map((e) => (
                      <tr key={e.id} className="border-t border-border align-top">
                        <td className="px-2 py-1.5 font-mono text-muted-foreground">
                          {e.numero_linha ?? "—"}
                        </td>
                        <td className="px-2 py-1.5">{e.nome_completo ?? "—"}</td>
                        <td className="px-2 py-1.5">{e.email_acesso ?? "—"}</td>
                        <td className="px-2 py-1.5">{e.whatsapp ?? "—"}</td>
                        <td className="px-2 py-1.5 text-red-700">{e.erro ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
