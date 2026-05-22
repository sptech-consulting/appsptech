// Webhook público para criação de novidades.
// Substitui a antiga rota TanStack /api/public/novidades/webhook/$token
// URL pública: https://<project-ref>.supabase.co/functions/v1/novidades-webhook/<token>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

type Payload = {
  titulo: string;
  resumo?: string | null;
  conteudo?: string | null;
  imagem_url?: string | null;
  fonte_url?: string | null;
  fonte_nome?: string | null;
  categoria?: string | null;
  tags?: string[] | null;
};

function validatePayload(raw: unknown): { ok: true; data: Payload } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be an object" };
  const o = raw as Record<string, unknown>;
  const titulo = o.titulo;
  if (typeof titulo !== "string" || titulo.length < 1 || titulo.length > 500) {
    return { ok: false, error: "titulo required (1-500 chars)" };
  }
  const str = (v: unknown, max: number) =>
    v == null ? null : typeof v === "string" && v.length <= max ? v : "__invalid__";
  const resumo = str(o.resumo, 2000);
  const conteudo = str(o.conteudo, 50_000);
  const imagem_url = str(o.imagem_url, 2000);
  const fonte_url = str(o.fonte_url, 2000);
  const fonte_nome = str(o.fonte_nome, 255);
  const categoria = str(o.categoria, 120);
  for (const [k, v] of [
    ["resumo", resumo], ["conteudo", conteudo], ["imagem_url", imagem_url],
    ["fonte_url", fonte_url], ["fonte_nome", fonte_nome], ["categoria", categoria],
  ] as const) {
    if (v === "__invalid__") return { ok: false, error: `${k} invalid` };
  }
  let tags: string[] | null = null;
  if (o.tags != null) {
    if (!Array.isArray(o.tags) || o.tags.length > 20) return { ok: false, error: "tags invalid" };
    for (const t of o.tags) {
      if (typeof t !== "string" || t.length > 60) return { ok: false, error: "tag invalid" };
    }
    tags = o.tags as string[];
  }
  return {
    ok: true,
    data: { titulo, resumo, conteudo, imagem_url, fonte_url, fonte_nome, categoria, tags },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  // Path: /functions/v1/novidades-webhook/<token>
  const parts = url.pathname.split("/").filter(Boolean);
  const token = parts[parts.length - 1];
  if (!token || token === "novidades-webhook" || token.length < 16 || token.length > 128) {
    return json({ error: "Invalid token" }, 401);
  }

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const parsed = validatePayload(raw);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: amb, error: ambErr } = await supabase
    .from("ambientes").select("id, status").eq("webhook_token", token).maybeSingle();
  if (ambErr) return json({ error: "Lookup failed" }, 500);
  if (!amb) return json({ error: "Invalid token" }, 401);
  if (amb.status !== "ativo") return json({ error: "Ambiente inativo" }, 403);

  const p = parsed.data;
  const { data: inserted, error: insErr } = await supabase
    .from("novidades").insert({
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
    }).select("id").single();
  if (insErr || !inserted) return json({ error: insErr?.message ?? "Insert failed" }, 500);

  return json({ ok: true, id: inserted.id }, 201);
});
