import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAlunoProfile } from "@/lib/auth";

type Ambiente = { id: string; nome: string; slug: string; cor_primaria: string | null; imagem_capa_url: string | null };

export const Route = createFileRoute("/aluno/")({
  component: AlunoHome,
});

function AlunoHome() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [profile, setProfile] = useState<{ nome_completo: string; email_acesso: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getAlunoProfile();
      setProfile(p);
      const { data } = await supabase
        .from("ambientes")
        .select("id,nome,slug,cor_primaria,imagem_capa_url")
        .eq("status", "ativo");
      setAmbientes(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {!profile ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-black text-secondary">Aluno não cadastrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu e-mail ainda não foi vinculado a um ambiente. Peça ao seu administrador para importar seu acesso.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-black text-secondary">Olá, {profile.nome_completo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Selecione um ambiente para entrar.</p>

          {loading ? (
            <div className="mt-6 text-sm text-muted-foreground">Carregando ambientes...</div>
          ) : ambientes.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Você ainda não está vinculado a nenhum ambiente ativo.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {ambientes.map((a) => (
                <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="h-24" style={{ backgroundColor: a.cor_primaria ?? "#ED145B" }} />
                  <div className="p-4">
                    <div className="font-bold text-secondary">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">/{a.slug}</div>
                    <button disabled className="mt-3 w-full rounded-md bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground opacity-60">
                      Home do ambiente — Fase 5
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
