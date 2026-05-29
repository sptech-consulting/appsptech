import { toEmbedUrl } from "@/lib/video-embed";
import { FileText, Download, Presentation, ExternalLink } from "lucide-react";

type Tipo = "video" | "pptx" | "imagem" | "documento" | "link" | null;

type Props = {
  tipo: Tipo;
  url: string | null;
  imagemFallback?: string | null;
  primaria?: string;
};

export function ApresentacaoBlock({ tipo, url, imagemFallback, primaria = "#ED145B" }: Props) {
  if (!url && !imagemFallback) return null;

  if (tipo === "video" && url) {
    const embed = toEmbedUrl(url);
    if (embed) {
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={embed}
            className="absolute inset-0 h-full w-full"
            title="Apresentação"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <video src={url} controls className="w-full rounded-2xl bg-black shadow-2xl" preload="metadata" />
    );
  }

  if (tipo === "imagem" && url) {
    return <img src={url} alt="Apresentação" className="w-full rounded-2xl shadow-2xl" />;
  }

  // pptx / documento / link / fallback → mostra imagem (se houver) + botão para abrir/baixar
  const Icon = tipo === "pptx" ? Presentation : tipo === "documento" ? FileText : ExternalLink;
  const cta = tipo === "documento" ? "Baixar documento" : tipo === "pptx" ? "Abrir apresentação" : "Abrir link";

  return (
    <div className="space-y-4">
      {imagemFallback && (
        <img src={imagemFallback} alt="Apresentação" className="w-full rounded-2xl shadow-2xl" />
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
          style={{ backgroundColor: primaria }}
        >
          <Icon className="h-4 w-4" />
          {cta}
          {tipo === "documento" ? <Download className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
        </a>
      )}
    </div>
  );
}
