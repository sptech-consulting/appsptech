import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

type Props = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** Pasta dentro do bucket "plataforma". Ex.: "ambientes/logos" */
  folder: string;
  /** Tipos aceitos. Default: image/* */
  accept?: string;
  /** Tamanho máx em MB. Default 5 */
  maxMB?: number;
  /** Label opcional */
  label?: string;
  /** Aspect ratio do preview (ex.: "aspect-square", "aspect-video"). Default "aspect-video" */
  aspect?: string;
  /** Texto descritivo abaixo do controle */
  helper?: string;
};

const BUCKET = "plataforma";

export function ImageUpload({
  value,
  onChange,
  folder,
  accept = "image/*",
  maxMB = 5,
  label,
  aspect = "aspect-video",
  helper,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Arquivo maior que ${maxMB} MB.`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeFolder = folder.replace(/^\/+|\/+$/g, "");
      const path = `${safeFolder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada.");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <div className="text-sm font-medium text-secondary">{label}</div>}
      <div className="flex items-start gap-3">
        <div
          className={`${aspect} w-32 shrink-0 rounded-md border border-border bg-muted/40 overflow-hidden flex items-center justify-center`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3" /> {value ? "Trocar" : "Enviar"}
                </>
              )}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <X className="h-3 w-3" /> Remover
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {helper && <div className="text-[11px] text-muted-foreground">{helper}</div>}
          {value && (
            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-full" title={value}>
              {value.split("/").pop()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
