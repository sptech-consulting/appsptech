// Utilitário compartilhado para gerar URLs de embed de vídeo (YouTube + Vimeo)
// e parsear timestamps em formato "90", "90s", "1m30s", "1h2m3s".

export function parseStartSeconds(v: string | null | undefined): number {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!m) return 0;
  const [, h, mi, s] = m;
  return parseInt(h || "0", 10) * 3600 + parseInt(mi || "0", 10) * 60 + parseInt(s || "0", 10);
}

export function toEmbedUrl(url: string, startAt = 0): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      let id = "";
      if (host === "youtu.be") {
        id = u.pathname.slice(1).split("/")[0];
      } else {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts[0] === "watch") id = u.searchParams.get("v") ?? "";
        else if (["embed", "shorts", "live", "v"].includes(parts[0])) id = parts[1] ?? "";
        else id = u.searchParams.get("v") ?? "";
      }
      if (!id) return null;
      const start =
        parseStartSeconds(u.searchParams.get("t") ?? u.searchParams.get("start")) || Math.floor(startAt);
      const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
      if (start > 0) params.set("start", String(start));
      return `https://www.youtube.com/embed/${id}?${params.toString()}`;
    }

    if (host.endsWith("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      let id = "";
      let hash: string | null = null;
      if (parts[0] === "video") {
        id = parts[1] ?? "";
        hash = parts[2] ?? null;
      } else {
        id = parts[0] ?? "";
        hash = parts[1] ?? null;
      }
      if (!/^\d+$/.test(id)) return null;
      const params = new URLSearchParams();
      if (hash) params.set("h", hash);
      const start = Math.floor(startAt);
      let suffix = params.toString() ? `?${params.toString()}` : "";
      if (start > 0) suffix += `${suffix ? "&" : "#"}t=${start}s`;
      return `https://player.vimeo.com/video/${id}${suffix}`;
    }

    return null;
  } catch {
    return null;
  }
}
