import { Wrench, Newspaper, GraduationCap, BookOpen, ExternalLink, PlayCircle, Download, Sparkles, LogOut, Moon, Volume2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { EffectCard } from "./EffectCard";
import { DEFAULT_EFFECTS, type AmbienteEffects } from "@/lib/ambiente-effects";

export type AmbienteVisual = {
  nome: string;
  descricao?: string;
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
  compacto: "14px",
  medio: "20px",
  grande: "26px",
};

type SectionKey = "ferramentas" | "novidades" | "playbook" | "aulas";

export function AmbientePreview({ v }: { v: AmbienteVisual }) {
  const [active, setActive] = useState<SectionKey>("ferramentas");
  const radius = RADII[v.card_borda];
  const padding = PAD[v.card_tamanho];

  const tk = {
    bg: v.cor_fundo,
    text: v.cor_texto,
    card: v.cor_card,
    border: v.cor_borda,
    navBg: "rgba(255,255,255,0.78)",
    navText: v.cor_secundaria,
    primaria: v.cor_primaria,
    secundaria: v.cor_secundaria,
    botao: v.cor_botao,
  };

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

  const shadow = v.card_estilo === "sombra" || v.card_sombra ? "0 10px 24px -12px rgba(0,0,0,0.25)" : "none";
  const cardBorder = v.card_estilo === "borda" ? `1px solid ${tk.border}` : "none";

  const cardBase: React.CSSProperties = {
    backgroundColor: v.card_estilo === "imagem" ? "transparent" : tk.card,
    color: tk.text,
    borderRadius: radius,
    padding,
    boxShadow: shadow,
    border: cardBorder,
    backgroundImage:
      v.card_estilo === "imagem"
        ? "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), linear-gradient(135deg, var(--cp), var(--cs))"
        : undefined,
  };

  const enterClass = effects.efeito_entrada_animada ? "fx-enter" : "";
  const btnLift = effects.efeito_botao_lift ? "fx-btn-lift" : "";

  const ferramentas = [
    { id: "f1", nome: "Ferramenta 1", categoria: "Apps", descricao: "Acesso rápido à plataforma do programa.", destaque: true },
    { id: "f2", nome: "Ferramenta 2", categoria: "Apps", descricao: "Recurso complementar do ambiente." },
    { id: "f3", nome: "Ferramenta 3", categoria: "Apps", descricao: "Mais um exemplo de card de ferramenta." },
  ];
  const novidades = [
    { id: "n1", titulo: "Novidade em destaque", categoria: "IA", resumo: "Resumo curto da novidade publicada recentemente.", destaque: true },
    { id: "n2", titulo: "Outra novidade", categoria: "Produto", resumo: "Como exemplo de segundo card no carrossel." },
  ];
  const aulas = [
    { id: "a1", titulo: "Aula introdutória", modulo: "Módulo 1", descricao: "12 min · Vídeo", material: true },
    { id: "a2", titulo: "Próxima aula", modulo: "Módulo 1", descricao: "18 min · Vídeo", material: false },
    { id: "a3", titulo: "Aprofundamento", modulo: "Módulo 2", descricao: "22 min · Vídeo", material: true },
  ];
  const playbook = aulas.filter((a) => a.material);

  const sections: { key: SectionKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "ferramentas", label: "Ferramentas", icon: <Wrench className="h-3 w-3" />, count: ferramentas.length },
    { key: "novidades", label: "Novidades", icon: <Newspaper className="h-3 w-3" />, count: novidades.length },
    { key: "playbook", label: "Playbook", icon: <BookOpen className="h-3 w-3" />, count: playbook.length },
    { key: "aulas", label: "Aulas", icon: <GraduationCap className="h-3 w-3" />, count: aulas.length },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden border border-border relative"
      style={
        {
          backgroundColor: tk.bg,
          color: tk.text,
          ["--cp" as any]: tk.primaria,
          ["--cs" as any]: tk.secundaria,
          ["--blob-1" as any]: tk.primaria,
          ["--blob-2" as any]: tk.secundaria,
        } as React.CSSProperties
      }
    >
      {effects.efeito_blobs_fundo && <div className="fx-blobs pointer-events-none" />}

      {/* Floating top nav pill */}
      <div className="relative z-20 pt-3 px-3 flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-0.5 px-1 py-1 backdrop-blur-md shadow-md mx-auto"
          style={{
            backgroundColor: tk.navBg,
            color: tk.navText,
            borderRadius: 9999,
            border: `1px solid ${tk.border}`,
          }}
        >
          {sections.map((s) => {
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1 ${btnLift}`}
                style={{
                  backgroundColor: isActive ? tk.primaria : "transparent",
                  color: isActive ? "#fff" : tk.navText,
                }}
              >
                {s.icon}
                <span>{s.label}</span>
                {s.count > 0 && (
                  <span
                    className="text-[8px] font-bold px-1 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,.25)" : tk.primaria + "22",
                      color: isActive ? "#fff" : tk.primaria,
                    }}
                  >
                    {s.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <IconChip tk={tk}><Volume2 className="h-3 w-3" /></IconChip>
          <IconChip tk={tk}><Moon className="h-3 w-3" /></IconChip>
          <button
            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1.5 rounded-full ${btnLift}`}
            style={{ backgroundColor: tk.primaria, color: "#fff" }}
          >
            <Sparkles className="h-2.5 w-2.5" /> Resultados
          </button>
          <button
            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1.5 rounded-full ${btnLift}`}
            style={{ backgroundColor: tk.botao, color: "#fff" }}
          >
            <LogOut className="h-2.5 w-2.5" /> Sair
          </button>
        </div>
      </div>

      <main className="relative z-10 px-5 sm:px-8 pt-10 pb-8 space-y-10">
        {/* Hero */}
        <header className="text-center pt-2">
          <div className="inline-flex items-center gap-2 mb-3">
            {v.logo_url ? (
              <img src={v.logo_url} alt={v.nome} className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-md" style={{ backgroundColor: tk.primaria }} />
            )}
          </div>
          <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: tk.primaria }}>
            Olá, Aluno
          </div>
          <h1
            className="text-3xl sm:text-5xl font-black leading-[0.95] tracking-tight"
            style={{
              backgroundImage: `linear-gradient(135deg, ${tk.primaria}, ${tk.secundaria})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {v.nome || "Ambiente"}
          </h1>
          {v.descricao && <p className="mt-2 mx-auto max-w-md text-xs opacity-70">{v.descricao}</p>}
        </header>

        {/* Ferramentas */}
        <PreviewSection title="Ferramentas" subtitle="Acesse os apps e plataformas do seu programa" tk={tk}>
          <Carousel enterClass={enterClass}>
            {ferramentas.map((f) => (
              <EffectCard
                key={f.id}
                effects={effects}
                baseStyle={{ ...cardBase, minWidth: 220, maxWidth: 240 }}
                primaria={tk.primaria}
              >
                {v.card_exibir_icone && (
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: tk.primaria }}
                    >
                      <Wrench className="h-4 w-4" />
                    </div>
                    {f.destaque && (
                      <span
                        className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: tk.primaria + "22", color: tk.primaria }}
                      >
                        Destaque
                      </span>
                    )}
                  </div>
                )}
                <div className="text-[9px] uppercase tracking-wider opacity-60 mb-1">{f.categoria}</div>
                <div className="font-bold text-sm leading-tight">{f.nome}</div>
                <div className="mt-1 text-[11px] opacity-70 line-clamp-2">{f.descricao}</div>
                <div
                  className={`mt-3 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full ${btnLift}`}
                  style={{ backgroundColor: tk.botao, color: "#fff" }}
                >
                  Acessar <ExternalLink className="h-2.5 w-2.5" />
                </div>
              </EffectCard>
            ))}
          </Carousel>
        </PreviewSection>

        {/* Novidades */}
        <PreviewSection title="Novidades" subtitle="O que está acontecendo no mundo da IA" tk={tk}>
          <Carousel enterClass={enterClass}>
            {novidades.map((n) => (
              <EffectCard
                key={n.id}
                effects={effects}
                baseStyle={{ ...cardBase, minWidth: 240, maxWidth: 260, padding: 0, overflow: "hidden" }}
                primaria={tk.primaria}
              >
                {v.card_exibir_imagem && (
                  <div
                    className="h-24 w-full"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${tk.primaria}, ${tk.secundaria})`,
                    }}
                  />
                )}
                <div style={{ padding }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: tk.primaria + "22", color: tk.primaria }}
                    >
                      {n.categoria}
                    </span>
                    {n.destaque && (
                      <span
                        className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: tk.primaria, color: "#fff" }}
                      >
                        Destaque
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm leading-snug line-clamp-2">{n.titulo}</div>
                  <div className="mt-1 text-[11px] opacity-70 line-clamp-2">{n.resumo}</div>
                </div>
              </EffectCard>
            ))}
          </Carousel>
        </PreviewSection>

        {/* Playbook */}
        <PreviewSection title="Playbook" subtitle="Baixe os materiais complementares das aulas" tk={tk}>
          <Carousel enterClass={enterClass}>
            {playbook.map((a) => (
              <EffectCard
                key={`pb-${a.id}`}
                effects={effects}
                baseStyle={{ ...cardBase, minWidth: 220, maxWidth: 240 }}
                primaria={tk.primaria}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: tk.primaria }}
                  >
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-[9px] uppercase tracking-wider opacity-60 mb-1">{a.modulo}</div>
                <div className="font-bold text-sm leading-snug">{a.titulo}</div>
                <div className="mt-1 text-[11px] opacity-70">{a.descricao}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full ${btnLift}`}
                    style={{ backgroundColor: tk.botao, color: "#fff" }}
                  >
                    <Download className="h-2.5 w-2.5" /> Material
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full"
                    style={{ backgroundColor: "transparent", color: tk.text, border: `1px solid ${tk.border}` }}
                  >
                    Ver aula <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </EffectCard>
            ))}
          </Carousel>
        </PreviewSection>

        {/* Aulas */}
        <PreviewSection title="Aulas" subtitle="Conteúdo do seu programa" tk={tk}>
          <Carousel enterClass={enterClass}>
            {aulas.map((a) => (
              <EffectCard
                key={a.id}
                effects={effects}
                baseStyle={{ ...cardBase, minWidth: 240, maxWidth: 260, padding: 0, overflow: "hidden" }}
                primaria={tk.primaria}
              >
                {v.card_exibir_imagem && (
                  <div
                    className="h-24 w-full flex items-center justify-center"
                    style={{ backgroundImage: `linear-gradient(135deg, ${tk.primaria}, ${tk.secundaria})` }}
                  >
                    <PlayCircle className="h-8 w-8 text-white/90" />
                  </div>
                )}
                <div style={{ padding }}>
                  <div className="text-[9px] uppercase tracking-wider opacity-60 mb-1">{a.modulo}</div>
                  <div className="font-bold text-sm leading-snug">{a.titulo}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] opacity-70">
                    <span>{a.descricao}</span>
                    {a.material && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5" /> Material
                      </span>
                    )}
                  </div>
                </div>
              </EffectCard>
            ))}
          </Carousel>
        </PreviewSection>
      </main>
    </div>
  );
}

function IconChip({ tk, children }: { tk: { navBg: string; navText: string; border: string }; children: React.ReactNode }) {
  return (
    <div
      className="h-6 w-6 rounded-full backdrop-blur-md flex items-center justify-center"
      style={{ backgroundColor: tk.navBg, color: tk.navText, border: `1px solid ${tk.border}` }}
    >
      {children}
    </div>
  );
}

function PreviewSection({
  title,
  subtitle,
  tk,
  children,
}: {
  title: string;
  subtitle?: string;
  tk: { primaria: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-1" style={{ color: tk.primaria }}>
          Seção
        </div>
        <h2 className="text-xl sm:text-2xl font-black">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs opacity-70">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Carousel({ enterClass, children }: { enterClass: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <button
        onClick={() => scroll(-1)}
        className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur border border-border items-center justify-center shadow"
        aria-label="Anterior"
        type="button"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>
      <button
        onClick={() => scroll(1)}
        className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur border border-border items-center justify-center shadow"
        aria-label="Próximo"
        type="button"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
      <div
        ref={ref}
        className={`flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 ${enterClass}`}
        style={{ scrollbarWidth: "thin" }}
      >
        {Array.isArray(children)
          ? (children as React.ReactNode[]).map((child, i) => (
              <div key={i} className="snap-start shrink-0">
                {child}
              </div>
            ))
          : <div className="snap-start shrink-0">{children}</div>}
      </div>
    </div>
  );
}
