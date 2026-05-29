import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Shield } from "lucide-react";
import { toast } from "sonner";

type Grupo = {
  id: string;
  nome: string;
  descricao: string | null;
  escopo: "global" | "ambiente";
  status: "ativo" | "inativo";
  grupo_permissoes: { id: string; permissao_id: string }[];
};
type Permissao = { id: string; chave: string; modulo: string; descricao: string | null };

export const Route = createFileRoute("/admin/grupos")({
  component: GruposPage,
});

function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Grupo | null>(null);
  const [openNew, setOpenNew] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase
        .from("grupos_acesso")
        .select("id,nome,descricao,escopo,status,grupo_permissoes(id,permissao_id)")
        .order("nome"),
      supabase.from("permissoes").select("id,chave,modulo,descricao").order("modulo").order("chave"),
    ]);
    setGrupos((g as any) ?? []);
    setPermissoes((p as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <PageHeader
        title="Grupos e permissões"
        description="Defina conjuntos de permissões e atribua a usuários administradores."
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4" /> Novo grupo
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : grupos.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum grupo cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-secondary">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Escopo</th>
                <th className="px-4 py-3 font-semibold">Permissões</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold text-secondary">
                    {g.nome}
                    {g.descricao && (
                      <div className="text-xs font-normal text-muted-foreground">{g.descricao}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{g.escopo}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Shield className="h-3 w-3" />
                      {g.grupo_permissoes.length}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        g.status === "ativo"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(g)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {openNew && (
        <GrupoDialog
          permissoes={permissoes}
          onClose={() => setOpenNew(false)}
          onSaved={() => {
            setOpenNew(false);
            void load();
          }}
        />
      )}

      {editing && (
        <GrupoDialog
          grupo={editing}
          permissoes={permissoes}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function GrupoDialog({
  grupo,
  permissoes,
  onClose,
  onSaved,
}: {
  grupo?: Grupo;
  permissoes: Permissao[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(grupo?.nome ?? "");
  const [descricao, setDescricao] = useState(grupo?.descricao ?? "");
  const [escopo, setEscopo] = useState<"global" | "ambiente">(grupo?.escopo ?? "ambiente");
  const [status, setStatus] = useState<"ativo" | "inativo">(grupo?.status ?? "ativo");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(grupo?.grupo_permissoes.map((gp) => gp.permissao_id) ?? []),
  );
  const [saving, setSaving] = useState(false);

  const byModulo = useMemo(() => {
    const m: Record<string, Permissao[]> = {};
    for (const p of permissoes) (m[p.modulo] ??= []).push(p);
    return m;
  }, [permissoes]);

  function togglePerm(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModulo(modulo: string) {
    const ids = byModulo[modulo].map((p) => p.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = ids.every((id) => next.has(id));
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function submit() {
    if (!nome.trim()) return toast.error("Informe um nome.");
    setSaving(true);
    try {
      let grupoId = grupo?.id;
      if (grupo) {
        const { error } = await supabase
          .from("grupos_acesso")
          .update({ nome, descricao: descricao || null, escopo, status })
          .eq("id", grupo.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("grupos_acesso")
          .insert({ nome, descricao: descricao || null, escopo, status })
          .select("id")
          .single();
        if (error) throw error;
        grupoId = data.id;
      }

      // Sync permissões: deleta tudo e reinsere
      if (grupoId) {
        await supabase.from("grupo_permissoes").delete().eq("grupo_id", grupoId);
        const rows = Array.from(selected).map((permissao_id) => ({
          grupo_id: grupoId!,
          permissao_id,
        }));
        if (rows.length > 0) {
          const { error } = await supabase.from("grupo_permissoes").insert(rows);
          if (error) throw error;
        }
      }
      toast.success("Grupo salvo.");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{grupo ? "Editar grupo" : "Novo grupo"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <Label>Escopo</Label>
            <select
              value={escopo}
              onChange={(e) => setEscopo(e.target.value as any)}
              className="w-full border border-border rounded-md px-2 py-2 text-sm"
            >
              <option value="ambiente">Por ambiente</option>
              <option value="global">Global</option>
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border border-border rounded-md px-2 py-2 text-sm"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="mt-2">
          <Label>Permissões</Label>
          <div className="mt-2 max-h-80 overflow-auto border border-border rounded-md p-3 space-y-3">
            {Object.entries(byModulo).map(([modulo, perms]) => {
              const allChecked = perms.every((p) => selected.has(p.id));
              const someChecked = perms.some((p) => selected.has(p.id));
              return (
                <div key={modulo}>
                  <label className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = !allChecked && someChecked;
                      }}
                      onChange={() => toggleModulo(modulo)}
                    />
                    {modulo}
                  </label>
                  <div className="ml-6 mt-1 grid grid-cols-2 gap-1">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => togglePerm(p.id)}
                        />
                        <span className="font-mono">{p.chave.replace(`${modulo}.`, "")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
