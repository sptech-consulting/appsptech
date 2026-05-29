import { forwardRef } from "react";
import { useCardTilt, useHoverSound, cardTiltStyle, type AmbienteEffects } from "@/lib/ambiente-effects";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  effects: AmbienteEffects;
  baseStyle?: React.CSSProperties;
  primaria?: string;
};

/**
 * Card wrapper that applies the configured ambient effects:
 * tilt 3D, scale-up, glow border, hover sound.
 */
export const EffectCard = forwardRef<HTMLDivElement, Props>(function EffectCard(
  { effects, baseStyle, primaria, className = "", children, ...rest },
  _fwdRef
) {
  const tiltRef = useCardTilt(effects.efeito_card_tilt_3d);
  const playSound = useHoverSound(effects.efeito_som_hover, effects.efeito_som_volume);

  const style: React.CSSProperties = {
    ...baseStyle,
    ...(effects.efeito_card_tilt_3d ? cardTiltStyle(true) : {}),
    ...(effects.efeito_card_scale && !effects.efeito_card_tilt_3d
      ? { transition: "transform .25s cubic-bezier(.16,1,.3,1), box-shadow .3s" }
      : {}),
  };

  const glow = effects.efeito_card_glow
    ? ({
        ["--glow" as any]: primaria ?? "#ED145B",
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      ref={tiltRef}
      onPointerEnter={playSound}
      className={`effect-card ${effects.efeito_card_scale ? "fx-scale" : ""} ${
        effects.efeito_card_glow ? "fx-glow" : ""
      } ${className}`}
      style={{ ...style, ...glow }}
      {...rest}
    >
      {children}
    </div>
  );
});
