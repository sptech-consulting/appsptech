import { Wrench, Newspaper, GraduationCap } from "lucide-react";
import { EffectCard } from "./EffectCard";
import { DEFAULT_EFFECTS, type AmbienteEffects } from "@/lib/ambiente-effects";

export type AmbienteVisual = {
  nome: string;
  logo_url: string | null;
  imagem_capa_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  cor_texto: string;
  cor_botao: string;
  cor_card: string;
  cor_borda: string;
  card_estilo: "flat" | "sombra" | "borda" | "imagem";
  card_borda: "quadrado" | "levemente_arredondado" | "arredondado" | "pill";
  card_tamanho: "compacto" | "medio" | "grande";
  card_sombra: boolean;
  card_exibir_icone: boolean;
  card_exibir_imagem: boolean;
} & Partial<AmbienteEffects>;

const RADII: Record<AmbienteVisual["card_borda"], string> = {
  quadrado: "0px",
  levemente_arredondado: "6px",
  arredondado: "16px",
  pill: "9999px",
};

const PAD: Record<AmbienteVisual["card_tamanho"], string> = {
  compacto: "12px",
  medio: "18px",
  grande: "26px",
};

export function AmbientePreview({ v }: { v: AmbienteVisual }) {
  const radius = RADII[v.card_borda];
  const padding = PAD[v.card_tamanho];
  const shadow =
    v.card_estilo === "sombra" || v.card_sombra ? "0 10px 24px -12px rgba(0,0,0,0.25)" : "none";
  const border =
    v.card_estilo === "borda" ? `1px solid ${v.cor_borda}` : v.card_estilo === "flat" ? "none" : "none";

  const effects: AmbienteEffects = {
    ...DEFAULT_EFFECTS,
    efeito_card_tilt_3d: v.efeito_card_tilt_3d ?? false,
    efeito_card_glow: v.efeito_card_glow ?? false,
    efeito_card_scale: v.efeito_card_scale ?? false,
    efeito_botao_lift: v.efeito_botao_lift ?? false,
    efeito_entrada_animada: v.efeito_entrada_animada ?? false,
    efeito_som_hover: v.efeito_som_hover ?? false,
    efeito_som_volume: v.efeito_som_volume ?? 40,
    efeito_blobs_fundo: v.efeito_blobs_fundo ?? false,
  };

  const cardBase: React.CSSProperties = {
    backgroundColor: v.card_estilo === "imagem" ? "transparent" : v.cor_card,
    color: v.cor_texto,
    borderRadius: radius,
    padding,
    boxShadow: shadow,
    border,
    backgroundImage:
      v.card_estilo === "imagem"
        ? "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), linear-gradient(135deg, var(--cp), var(--cs))"
        : undefined,
  };

  const enterClass = effects.efeito_entrada_animada ? "fx-enter" : "";

  return (
    <div
      className="rounded-xl overflow-hidden border border-border relative"
      style={
        {
          ["--cp" as any]: v.cor_primaria,
          ["--cs" as any]: v.cor_secundaria,
          ["--blob-1" as any]: v.cor_primaria,
          ["--blob-2" as any]: v.cor_secundaria,
        } as React.CSSProperties
      }
    >
      {effects.efeito_blobs_fundo && <div className="fx-blobs" />}
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between relative z-10"
        style={{ backgroundColor: v.cor_secundaria, color: "#fff" }}
      >
        <div className="flex items-center gap-2">
          {v.logo_url ? (
            <img src={v.logo_url} alt="" className="h-6 w-auto" />
          ) : (
            <div className="h-6 w-6 rounded" style={{ backgroundColor: v.cor_primaria }} />
          )}
          <span className="text-sm font-bold tracking-tight">{v.nome || "Ambiente"}</span>
        </div>
        <button
          className={`text-xs font-semibold px-3 py-1 ${effects.efeito_botao_lift ? "fx-btn-lift" : ""}`}
          style={{ backgroundColor: v.cor_botao, color: "#fff", borderRadius: radius }}
        >
          Entrar
        </button>
      </div>

      {/* Body */}
      <div
        style={{ backgroundColor: v.cor_fundo, color: v.cor_texto }}
        className="p-5 space-y-5 relative z-10"
      >
        <div
          className="rounded-lg p-6 text-white"
          style={{
            backgroundImage: v.imagem_capa_url
              ? `linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.05)), url(${v.imagem_capa_url})`
              : `linear-gradient(135deg, ${v.cor_primaria}, ${v.cor_secundaria})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: radius,
          }}
        >
          <div className="text-[10px] uppercase tracking-widest opacity-80">Banner</div>
          <div className="mt-1 text-lg font-black">Bem-vindo ao {v.nome || "ambiente"}</div>
        </div>

        <PreviewSection title="Ferramentas" icon={<Wrench className="h-3 w-3" />} corTitulo={v.cor_secundaria}>
          <div className={`grid grid-cols-3 gap-3 ${enterClass}`}>
            {[1, 2, 3].map((i) => (
              <EffectCard key={i} effects={effects} baseStyle={cardBase} primaria={v.cor_primaria}>
                {v.card_exibir_icone && (
                  <div
                    className="h-7 w-7 rounded mb-2 flex items-center justify-center text-white"
                    style={{ backgroundColor: v.cor_primaria }}
                  >
                    <Wrench className="h-4 w-4" />
                  </div>
                )}
                <div className="text-xs font-bold">Ferramenta {i}</div>
                <div className="text-[10px] opacity-70">Acesso rápido</div>
              </EffectCard>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Novidades" icon={<Newspaper className="h-3 w-3" />} corTitulo={v.cor_secundaria}>
          <div className={`grid grid-cols-2 gap-3 ${enterClass}`}>
            {[1, 2].map((i) => (
              <EffectCard key={i} effects={effects} baseStyle={cardBase} primaria={v.cor_primaria}>
                {v.card_exibir_imagem && (
                  <div
                    className="h-12 mb-2 rounded"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${v.cor_primaria}, ${v.cor_secundaria})`,
                      borderRadius: Math.min(parseInt(radius) || 0, 12) + "px",
                    }}
                  />
                )}
                <div className="text-xs font-bold">Novidade {i}</div>
                <div className="text-[10px] opacity-70">Lorem ipsum dolor sit amet</div>
              </EffectCard>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Aulas" icon={<GraduationCap className="h-3 w-3" />} corTitulo={v.cor_secundaria}>
          <div className={`grid grid-cols-3 gap-3 ${enterClass}`}>
            {[1, 2, 3].map((i) => (
              <EffectCard key={i} effects={effects} baseStyle={cardBase} primaria={v.cor_primaria}>
                <div className="text-xs font-bold">Aula {i}</div>
                <div className="text-[10px] opacity-70">12 min · Vídeo</div>
              </EffectCard>
            ))}
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  icon,
  corTitulo,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  corTitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold"
        style={{ color: corTitulo }}
      >
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
