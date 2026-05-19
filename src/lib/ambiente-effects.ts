import { useEffect, useRef, useCallback } from "react";

export type AmbienteEffects = {
  efeito_card_tilt_3d: boolean;
  efeito_card_glow: boolean;
  efeito_card_scale: boolean;
  efeito_botao_lift: boolean;
  efeito_entrada_animada: boolean;
  efeito_som_hover: boolean;
  efeito_som_volume: number;
  efeito_blobs_fundo: boolean;
};

export const DEFAULT_EFFECTS: AmbienteEffects = {
  efeito_card_tilt_3d: false,
  efeito_card_glow: false,
  efeito_card_scale: false,
  efeito_botao_lift: false,
  efeito_entrada_animada: false,
  efeito_som_hover: false,
  efeito_som_volume: 40,
  efeito_blobs_fundo: false,
};

export const EFFECT_PRESETS: Record<"nenhum" | "sutil" | "padrao" | "imersivo", AmbienteEffects> = {
  nenhum: { ...DEFAULT_EFFECTS },
  sutil: {
    ...DEFAULT_EFFECTS,
    efeito_card_scale: true,
    efeito_botao_lift: true,
    efeito_entrada_animada: true,
  },
  padrao: {
    ...DEFAULT_EFFECTS,
    efeito_card_glow: true,
    efeito_card_scale: true,
    efeito_botao_lift: true,
    efeito_entrada_animada: true,
  },
  imersivo: {
    efeito_card_tilt_3d: true,
    efeito_card_glow: true,
    efeito_card_scale: true,
    efeito_botao_lift: true,
    efeito_entrada_animada: true,
    efeito_som_hover: true,
    efeito_som_volume: 50,
    efeito_blobs_fundo: true,
  },
};

// ---------- Web Audio synth (tap-style hover sound) ----------
let _ctx: AudioContext | null = null;
let _lastAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    const C = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!C) return null;
    _ctx = new C();
  }
  if (_ctx.state === "suspended") void _ctx.resume();
  return _ctx;
}

export function playHoverTap(volume: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = performance.now();
  if (now - _lastAt < 100) return;
  _lastAt = now;

  const t = ctx.currentTime;
  const master = ctx.createGain();
  const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.045), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(520, t);
  filter.Q.setValueAtTime(1.8, t);

  const peak = Math.max(0, Math.min(1, volume / 100)) * 0.12;
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.004);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

  src.connect(filter);
  filter.connect(master);
  master.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.05);
}

// ---------- Card tilt 3D hook ----------
export function useCardTilt(enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const reset = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
      el.style.setProperty("--s", "1");
    };
    reset();

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const px = x / r.width;
      const py = y / r.height;
      // Match docs/referencia_efeitos_missao_ia.html — inclination is bold and perceptible.
      const rx = (py - 0.5) * 17;
      const ry = (0.5 - px) * 22;
      const tx = (0.5 - px) * 28;
      const ty = (0.5 - py) * 22 - 10;
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
      el.style.setProperty("--s", "1.035");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("pointercancel", reset);
    };
  }, [enabled]);

  return ref;
}

export function useHoverSound(enabled: boolean, volume: number) {
  return useCallback(() => {
    if (!enabled) return;
    playHoverTap(volume);
  }, [enabled, volume]);
}

// Style helpers
export function cardTiltStyle(enabled: boolean): React.CSSProperties {
  if (!enabled) return {};
  return {
    transform:
      "perspective(900px) translate3d(var(--tx,0), var(--ty,0), 0) rotateX(var(--rx,0)) rotateY(var(--ry,0)) scale(var(--s,1))",
    transformStyle: "preserve-3d",
    transition: "transform .12s cubic-bezier(.16,1,.3,1), box-shadow .3s ease",
    willChange: "transform",
  };
}
