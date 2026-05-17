import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { getAmbienteBranding } from "@/lib/ambiente.functions";

export const Route = createFileRoute("/e/$slug/")({
  beforeLoad: async ({ params }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/e/$slug/login", params: { slug: params.slug } });
  },
  component: AmbienteHome,
});

function AmbienteHome() {
  const { slug } = Route.useParams();
  const fetchBranding = useServerFn(getAmbienteBranding);
  const [b, setB] = useState<any>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const branding = await fetchBranding({ data: { slug } });
      setB(branding);
      const { data } = await supabase.from("ambientes").select("id").eq("slug", slug).maybeSingle();
      setAllowed(!!data);
    })();
  }, [slug, fetchBranding]);

  if (allowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-6 text-center">
        <div>
          <h1 className="text-xl font-black">Você não tem acesso a este ambiente.</h1>
          <button
            onClick={async () => {
              await signOut();
              window.location.assign(`/e/${slug}/login`);
            }}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const corFundo = b?.cor_fundo ?? "#FFFFFF";
  const corTexto = b?.cor_texto ?? "#1F2A44";
  const corPrim = b?.cor_primaria ?? "#ED145B";

  return (
    <div className="min-h-screen" style={{ backgroundColor: corFundo, color: corTexto }}>
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${b?.cor_borda ?? "#eee"}` }}>
        <div className="flex items-center gap-3">
          {b?.logo_url ? <img src={b.logo_url} alt="" className="h-8" /> : <div className="font-black" style={{ color: corPrim }}>{b?.nome ?? slug}</div>}
        </div>
        <button
          onClick={async () => {
            await signOut();
            window.location.assign(`/e/${slug}/login`);
          }}
          className="text-xs font-semibold opacity-70 hover:opacity-100"
        >
          Sair
        </button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h1 className="text-3xl font-black">Bem-vindo ao {b?.nome ?? slug}</h1>
        <p className="mt-2 opacity-70">Home white-label será construída na Fase 5.</p>
      </main>
    </div>
  );
}
