
type NovidadeRow = {
  id: string;
  titulo: string;
  resumo: string | null;
  categoria: string | null;
  imagem_url: string | null;
  fonte_url: string | null;
  fonte_nome: string | null;
  status: "rascunho" | "publicada" | "arquivada";
  publicado_em: string | null;
  criado_em: string;
};

function NovidadesPanel({ ambienteId }: { ambienteId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<NovidadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: amb }, { data: novs }] = await Promise.all([
      (supabase as any).from("ambientes").select("webhook_token").eq("id", ambienteId).maybeSingle(),
      supabase
        .from("novidades")
        .select("id,titulo,resumo,categoria,imagem_url,fonte_url,fonte_nome,status,publicado_em,criado_em")
        .eq("ambiente_id", ambienteId)
        .order("criado_em", { ascending: false }),
    ]);
    setToken((amb as any)?.webhook_token ?? null);
    setItems((novs as NovidadeRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienteId]);

  async function regenerate() {
    if (!confirm("Gerar um novo token? O n8n precisará ser atualizado com a nova URL.")) return;
    setRegenerating(true);
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { error } = await (supabase as any)
      .from("ambientes")
      .update({ webhook_token: newToken })
      .eq("id", ambienteId);
    setRegenerating(false);
    if (error) return toast.error(error.message);
    toast.success("Novo token gerado.");
    void load();
  }

  async function removeNov(id: string) {
    if (!confirm("Excluir esta novidade?")) return;
    const { error } = await supabase.from("novidades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Novidade excluída.");
    void load();
  }

  async function toggleStatus(n: NovidadeRow) {
    const novo = n.status === "publicada" ? "arquivada" : "publicada";
    const { error } = await supabase
      .from("novidades")
      .update({
        status: novo,
        publicado_em: novo === "publicada" ? (n.publicado_em ?? new Date().toISOString()) : n.publicado_em,
      })
      .eq("id", n.id);
    if (error) return toast.error(error.message);
    void load();
  }

  const webhookUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/api/public/novidades/webhook/${token}`
      : "";

  return (
    <div className="border-t border-border">
      <div className="px-5 py-3 border-b border-border bg-muted">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Novidades deste ambiente</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          As novidades são recebidas via webhook (n8n busca notícias relacionadas e envia para esta URL).
        </p>
      </div>
      <div className="p-5 space-y-5">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Webhook URL</div>
          {loading ? (
            <div className="text-xs text-muted-foreground">Carregando…</div>
          ) : (
            <>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-card px-3 py-2 text-xs font-mono">
                  {webhookUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(webhookUrl);
                    toast.success("URL copiada");
                  }}
                >
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
                  Regenerar
                </Button>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Envie POST com JSON contendo: <code className="font-mono">titulo</code> (obrigatório), e opcionalmente{" "}
                <code className="font-mono">resumo</code>, <code className="font-mono">conteudo</code>,{" "}
                <code className="font-mono">imagem_url</code>, <code className="font-mono">fonte_url</code>,{" "}
                <code className="font-mono">fonte_nome</code>, <code className="font-mono">categoria</code>,{" "}
                <code className="font-mono">tags</code>.
              </div>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-secondary">Novidades recebidas ({items.length})</h4>
          </div>
          {loading ? (
            <div className="text-xs text-muted-foreground">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhuma novidade recebida ainda. Configure o webhook acima no seu fluxo do n8n.
            </div>
          ) : (
            <div className="rounded-md border border-border divide-y divide-border max-h-[480px] overflow-auto">
              {items.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 hover:bg-muted/40">
                  {n.imagem_url && (
                    <img
                      src={n.imagem_url}
                      alt=""
                      className="h-14 w-20 rounded object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-secondary line-clamp-1">{n.titulo}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.resumo || "—"}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          n.status === "publicada"
                            ? "bg-emerald-100 text-emerald-700"
                            : n.status === "arquivada"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {n.status}
                      </span>
                      {n.categoria && <span>{n.categoria}</span>}
                      {n.fonte_nome && <span>· {n.fonte_nome}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => toggleStatus(n)}
                      className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-muted"
                    >
                      {n.status === "publicada" ? "Arquivar" : "Publicar"}
                    </button>
                    <button
                      onClick={() => removeNov(n.id)}
                      className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
