import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PayloadSchema = z.object({
  titulo: z.string().min(1).max(500),
  resumo: z.string().max(2000).nullish(),
  conteudo: z.string().max(50000).nullish(),
  imagem_url: z.string().url().max(2000).nullish(),
  fonte_url: z.string().url().max(2000).nullish(),
  fonte_nome: z.string().max(255).nullish(),
  categoria: z.string().max(120).nullish(),
  tags: z.array(z.string().max(60)).max(20).nullish(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/novidades/webhook/$token")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const token = params.token;
        if (!token || token.length < 16 || token.length > 128) {
          return json({ error: "Invalid token" }, 401);
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const parsed = PayloadSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
        }

        const { data: amb, error: ambErr } = await supabaseAdmin
          .from("ambientes")
          .select("id, status")
          .eq("webhook_token", token)
          .maybeSingle();
        if (ambErr) return json({ error: "Lookup failed" }, 500);
        if (!amb) return json({ error: "Invalid token" }, 401);
        if (amb.status !== "ativo") return json({ error: "Ambiente inativo" }, 403);

        const p = parsed.data;
        const { data: inserted, error: insErr } = await supabaseAdmin
          .from("novidades")
          .insert({
            ambiente_id: amb.id,
            titulo: p.titulo,
            resumo: p.resumo ?? null,
            conteudo: p.conteudo ?? null,
            imagem_url: p.imagem_url ?? null,
            fonte_url: p.fonte_url ?? null,
            fonte_nome: p.fonte_nome ?? null,
            categoria: p.categoria ?? null,
            tags: p.tags ?? null,
            status: "publicada",
            publicado_em: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (insErr || !inserted) return json({ error: insErr?.message ?? "Insert failed" }, 500);

        return json({ ok: true, id: inserted.id }, 201);
      },
    },
  },
});
