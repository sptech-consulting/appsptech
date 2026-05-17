import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Upload, Link2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Aluno = {
  id: string;
  nome_completo: string;
  email_acesso: string;
  whatsapp: string | null;
  status: "ativo" | "inativo";
  auth_user_id: string | null;
  criado_em: string;
};

type AmbienteOpt = { id: string; nome: string; slug: string };

export const Route = createFileRoute("/admin/alunos")({
  component: AlunosPage,
});

function AlunosPage() {
  const [items, setItems] = useState<Aluno[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ambientes, setAmbientes] = useState<AmbienteOpt[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [vincOpen, setVincOpen] = useState<Aluno | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: alu, error: e1 }, { data: amb }, { data: vinc }] = await Promise.all([
      supabase
        .from("alunos")
        .select("id,nome_completo,email_acesso,whatsapp,status,auth_user_id,criado_em")
        .order("criado_em", { ascending: false }),
      supabase.from("ambientes").select("id,nome,slug").order("nome"),
      supabase.from("ambiente_alunos").select("aluno_id").eq("status", "ativo"),
    ]);
    if (e1) toast.error(e1.message);
    const cnt: Record<string, number> = {};
    (vinc ?? []).forEach((v) => {
      cnt[v.aluno_id] = (cnt[v.aluno_id] ?? 0) + 1;
    });
    setCounts(cnt);
    setItems((alu ?? []) as Aluno[]);
    setAmbientes(amb ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.nome_completo.toLowerCase().includes(q) ||
        a.email_acesso.toLowerCase().includes(q) ||
        (a.whatsapp ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Alunos"
        description="Cadastro de alunos da plataforma. Vincule cada aluno a um ou mais ambientes para liberar o acesso."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Importar CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setEditOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Novo aluno
            </Button>
          </div>
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou whatsapp…"
            className="pl-8"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} de {items.length}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {items.length === 0 ? "Nenhum aluno cadastrado." : "Nenhum resultado."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Ambientes</th>
                <th className="px-4 py-3 font-semibold">Acesso</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold text-secondary">{a.nome_completo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.email_acesso}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.whatsapp ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{counts[a.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    {a.auth_user_id ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Vinculado
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Pendente 1º acesso
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => setVincOpen(a)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Link2 className="h-3 w-3" /> Ambientes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(a);
                          setEditOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AlunoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={editing}
        ambientes={ambientes}
        onSaved={load}
      />
      <VincularDialog
        aluno={vincOpen}
        onClose={() => setVincOpen(null)}
        ambientes={ambientes}
        onSaved={load}
      />
      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        ambientes={ambientes}
        onDone={load}
      />
    </div>
  );
}

/* ─────────────── Form (criar/editar) ─────────────── */
function AlunoFormDialog({
  open,
  onOpenChange,
  editing,
  ambientes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Aluno | null;
  ambientes: AmbienteOpt[];
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [ambienteIds, setAmbienteIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome_completo ?? "");
    setEmail(editing?.email_acesso ?? "");
    setWhatsapp(editing?.whatsapp ?? "");
    setStatus((editing?.status as "ativo" | "inativo") ?? "ativo");
    if (editing) {
      void supabase
        .from("ambiente_alunos")
        .select("ambiente_id")
        .eq("aluno_id", editing.id)
        .eq("status", "ativo")
        .then(({ data }) => setAmbienteIds((data ?? []).map((d) => d.ambiente_id)));
    } else {
      setAmbienteIds([]);
    }
  }, [open, editing]);

  function toggleAmbiente(id: string) {
    setAmbienteIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        nome_completo: nome.trim(),
        email_acesso: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim() || null,
        status,
      };
      let alunoId = editing?.id;
      if (editing) {
        const { error } = await supabase.from("alunos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("alunos")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        alunoId = data.id;
      }
      // sincroniza vínculos
      if (alunoId) {
        const { data: existing } = await supabase
          .from("ambiente_alunos")
          .select("id, ambiente_id, status")
          .eq("aluno_id", alunoId);
        const existingMap = new Map((existing ?? []).map((e) => [e.ambiente_id, e]));
        const toInsert: { aluno_id: string; ambiente_id: string; origem: string }[] = [];
        const toActivate: string[] = [];
        const toDeactivate: string[] = [];
        for (const aid of ambienteIds) {
          const e = existingMap.get(aid);
          if (!e) toInsert.push({ aluno_id: alunoId, ambiente_id: aid, origem: "manual" });
          else if (e.status !== "ativo") toActivate.push(e.id);
        }
        for (const [aid, e] of existingMap) {
          if (!ambienteIds.includes(aid) && e.status === "ativo") toDeactivate.push(e.id);
        }
        if (toInsert.length) {
          const { error } = await supabase.from("ambiente_alunos").insert(toInsert);
          if (error) throw error;
        }
        if (toActivate.length) {
          await supabase.from("ambiente_alunos").update({ status: "ativo" }).in("id", toActivate);
        }
        if (toDeactivate.length) {
          await supabase
            .from("ambiente_alunos")
            .update({ status: "inativo" })
            .in("id", toDeactivate);
        }
      }
      toast.success(editing ? "Aluno atualizado." : "Aluno criado.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">E-mail de acesso *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <p className="mt-1 text-xs text-muted-foreground">
              O aluno usará este e-mail para definir a senha no primeiro acesso em /e/{slug}/login.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 9..." />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">Ambientes vinculados</Label>
            <div className="mt-1 max-h-40 overflow-auto rounded-md border border-border p-2 space-y-1">
              {ambientes.length === 0 && (
                <div className="text-xs text-muted-foreground">Nenhum ambiente cadastrado.</div>
              )}
              {ambientes.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ambienteIds.includes(a.id)}
                    onChange={() => toggleAmbiente(a.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-secondary">{a.nome}</span>
                  <span className="text-xs text-muted-foreground font-mono">/{a.slug}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────── Vincular ambientes ─────────────── */
function VincularDialog({
  aluno,
  onClose,
  ambientes,
  onSaved,
}: {
  aluno: Aluno | null;
  onClose: () => void;
  ambientes: AmbienteOpt[];
  onSaved: () => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const open = !!aluno;

  useEffect(() => {
    if (!aluno) return;
    void supabase
      .from("ambiente_alunos")
      .select("ambiente_id")
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo")
      .then(({ data }) => setIds((data ?? []).map((d) => d.ambiente_id)));
  }, [aluno]);

  async function save() {
    if (!aluno) return;
    setBusy(true);
    try {
      const { data: existing } = await supabase
        .from("ambiente_alunos")
        .select("id, ambiente_id, status")
        .eq("aluno_id", aluno.id);
      const map = new Map((existing ?? []).map((e) => [e.ambiente_id, e]));
      const inserts: { aluno_id: string; ambiente_id: string; origem: string }[] = [];
      const activate: string[] = [];
      const deactivate: string[] = [];
      for (const aid of ids) {
        const e = map.get(aid);
        if (!e) inserts.push({ aluno_id: aluno.id, ambiente_id: aid, origem: "manual" });
        else if (e.status !== "ativo") activate.push(e.id);
      }
      for (const [aid, e] of map) {
        if (!ids.includes(aid) && e.status === "ativo") deactivate.push(e.id);
      }
      if (inserts.length) await supabase.from("ambiente_alunos").insert(inserts);
      if (activate.length)
        await supabase.from("ambiente_alunos").update({ status: "ativo" }).in("id", activate);
      if (deactivate.length)
        await supabase.from("ambiente_alunos").update({ status: "inativo" }).in("id", deactivate);
      toast.success("Vínculos atualizados.");
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vínculos a ambientes — {aluno?.nome_completo}</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 overflow-auto rounded-md border border-border p-2 space-y-1">
          {ambientes.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ids.includes(a.id)}
                onChange={() =>
                  setIds((cur) =>
                    cur.includes(a.id) ? cur.filter((x) => x !== a.id) : [...cur, a.id],
                  )
                }
                className="h-4 w-4 accent-primary"
              />
              <span className="text-secondary">{a.nome}</span>
              <span className="text-xs text-muted-foreground font-mono">/{a.slug}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy}>
            {busy ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────── Importação CSV ─────────────── */
type CsvRow = { nome: string; email: string; whatsapp: string; line: number };

function parseCsv(text: string): { rows: CsvRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: CsvRow[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows, errors: ["Arquivo vazio."] };

  const sep = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const idxNome = header.findIndex((h) => ["nome", "nome_completo", "nome completo"].includes(h));
  const idxEmail = header.findIndex((h) => ["email", "e-mail", "email_acesso"].includes(h));
  const idxWhats = header.findIndex((h) => ["whatsapp", "telefone", "celular"].includes(h));

  if (idxNome === -1 || idxEmail === -1) {
    errors.push("Cabeçalho deve conter ao menos as colunas 'nome' e 'email'.");
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep).map((p) => p.trim().replace(/^"|"$/g, ""));
    const nome = parts[idxNome] ?? "";
    const email = (parts[idxEmail] ?? "").toLowerCase();
    const whatsapp = idxWhats >= 0 ? (parts[idxWhats] ?? "") : "";
    rows.push({ nome, email, whatsapp, line: i + 1 });
  }
  return { rows, errors };
}

function ImportCsvDialog({
  open,
  onOpenChange,
  ambientes,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ambientes: AmbienteOpt[];
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [parseErr, setParseErr] = useState<string[]>([]);
  const [ambienteId, setAmbienteId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; skip: number; err: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview([]);
      setParseErr([]);
      setAmbienteId("");
      setResult(null);
    }
  }, [open]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    if (!f) return;
    const text = await f.text();
    const { rows, errors } = parseCsv(text);
    setPreview(rows);
    setParseErr(errors);
  }

  async function run() {
    if (!ambienteId) {
      toast.error("Escolha um ambiente para vincular os alunos importados.");
      return;
    }
    if (preview.length === 0) return;
    setBusy(true);
    let ok = 0;
    let skip = 0;
    let err = 0;
    try {
      const { data: imp, error: impErr } = await supabase
        .from("importacoes_alunos")
        .insert({
          ambiente_id: ambienteId,
          arquivo_nome: file?.name ?? null,
          tipo_arquivo: "csv",
          total_linhas: preview.length,
        })
        .select("id")
        .single();
      if (impErr) throw impErr;

      for (const row of preview) {
        if (!row.email || !row.nome) {
          err++;
          await supabase.from("importacoes_alunos_erros").insert({
            importacao_id: imp.id,
            numero_linha: row.line,
            email_acesso: row.email,
            nome_completo: row.nome,
            whatsapp: row.whatsapp,
            erro: "Nome ou e-mail vazio",
          });
          continue;
        }
        // Existe aluno?
        const { data: ex } = await supabase
          .from("alunos")
          .select("id")
          .ilike("email_acesso", row.email)
          .maybeSingle();
        let alunoId = ex?.id;
        if (!alunoId) {
          const { data: created, error: cerr } = await supabase
            .from("alunos")
            .insert({
              nome_completo: row.nome,
              email_acesso: row.email,
              whatsapp: row.whatsapp || null,
            })
            .select("id")
            .single();
          if (cerr) {
            err++;
            await supabase.from("importacoes_alunos_erros").insert({
              importacao_id: imp.id,
              numero_linha: row.line,
              email_acesso: row.email,
              nome_completo: row.nome,
              whatsapp: row.whatsapp,
              erro: cerr.message,
            });
            continue;
          }
          alunoId = created.id;
        }
        // vincula ao ambiente (idempotente)
        const { data: existingLink } = await supabase
          .from("ambiente_alunos")
          .select("id, status")
          .eq("aluno_id", alunoId)
          .eq("ambiente_id", ambienteId)
          .maybeSingle();
        if (!existingLink) {
          const { error: lerr } = await supabase.from("ambiente_alunos").insert({
            aluno_id: alunoId,
            ambiente_id: ambienteId,
            importacao_id: imp.id,
            origem: "csv",
          });
          if (lerr) {
            err++;
            continue;
          }
          ok++;
        } else if (existingLink.status !== "ativo") {
          await supabase.from("ambiente_alunos").update({ status: "ativo" }).eq("id", existingLink.id);
          ok++;
        } else {
          skip++;
        }
      }

      await supabase
        .from("importacoes_alunos")
        .update({
          status: err > 0 ? "concluido_com_erros" : "concluido",
          total_importados: ok,
          total_atualizados: skip,
          total_erros: err,
          finalizado_em: new Date().toISOString(),
        })
        .eq("id", imp.id);

      setResult({ ok, skip, err });
      toast.success(`Importação concluída: ${ok} novos, ${skip} já existiam, ${err} erros.`);
      onDone();
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Erro na importação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar alunos por CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            CSV com cabeçalho. Colunas aceitas: <strong>nome</strong>, <strong>email</strong> e
            opcionalmente <strong>whatsapp</strong>. Separador <code>,</code> ou <code>;</code>.
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Ambiente para vincular *
            </Label>
            <select
              value={ambienteId}
              onChange={(e) => setAmbienteId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
            >
              <option value="">Selecione um ambiente…</option>
              {ambientes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} (/{a.slug})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-secondary">Arquivo</Label>
            <Input type="file" accept=".csv,text/csv" onChange={onPick} />
          </div>
          {parseErr.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700">
              {parseErr.join(" ")}
            </div>
          )}
          {preview.length > 0 && (
            <div className="rounded-md border border-border max-h-48 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted text-secondary sticky top-0">
                  <tr className="text-left">
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">Nome</th>
                    <th className="px-2 py-1">E-mail</th>
                    <th className="px-2 py-1">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((r) => (
                    <tr key={r.line} className="border-t border-border">
                      <td className="px-2 py-1 text-muted-foreground">{r.line}</td>
                      <td className="px-2 py-1">{r.nome}</td>
                      <td className="px-2 py-1">{r.email}</td>
                      <td className="px-2 py-1">{r.whatsapp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <div className="p-2 text-xs text-muted-foreground">
                  + {preview.length - 50} linhas adicionais não mostradas no preview.
                </div>
              )}
            </div>
          )}
          {result && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <strong>{result.ok}</strong> novos vínculos, <strong>{result.skip}</strong> já
              existiam, <strong>{result.err}</strong> erros.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={run}
            disabled={busy || preview.length === 0 || parseErr.length > 0 || !ambienteId}
          >
            {busy ? "Importando…" : `Importar ${preview.length} linhas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const _unused_icons = Trash2;
