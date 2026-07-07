"use client";
import { useRef, useState } from "react";

export type Hotspot = { label: string; x: number; y: number; w: number; h: number };

type Props = {
  sceneUrl: string;
  hotspots: Hotspot[];
  onPoke?: () => void;
};

/**
 * Makes the AI illustration poke-able: each detected character/object gets an
 * invisible hotspot. On hover (or tap), that exact crop of the image wiggles on
 * top of the still scene — background-position math re-shows just that region —
 * with a label chip. The picture itself seems to come alive.
 */
export function SceneHotspots({ sceneUrl, hotspots, onPoke }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const tapTimer = useRef<number | null>(null);

  const activate = (i: number) => {
    if (active !== i) onPoke?.();
    setActive(i);
  };
  const tap = (i: number) => {
    activate(i);
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => setActive(null), 1400);
  };

  return (
    <>
      {hotspots.map((h, i) => {
        // Re-project this crop of the square scene: container is the hotspot box.
        const posX = h.w >= 1 ? 0 : (h.x / (1 - h.w)) * 100;
        const posY = h.h >= 1 ? 0 : (h.y / (1 - h.h)) * 100;
        return (
          <div
            key={i}
            onMouseEnter={() => activate(i)}
            onMouseLeave={() => setActive((a) => (a === i ? null : a))}
            onTouchStart={() => tap(i)}
            aria-label={`poke ${h.label}`}
            style={{
              position: "absolute",
              left: `${h.x * 100}%`, top: `${h.y * 100}%`,
              width: `${h.w * 100}%`, height: `${h.h * 100}%`,
              zIndex: 4, cursor: "pointer",
            }}
          >
            {active === i && (
              <>
                <div
                  className="hotspot-patch"
                  style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${sceneUrl})`,
                    backgroundSize: `${(1 / h.w) * 100}% ${(1 / h.h) * 100}%`,
                    backgroundPosition: `${posX}% ${posY}%`,
                  }}
                />
                <div
                  style={{
                    position: "absolute", left: "50%", top: -14, transform: "translate(-50%, -100%)",
                    background: "rgba(255,253,245,0.95)", color: "var(--ink)", whiteSpace: "nowrap",
                    padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                    boxShadow: "0 3px 10px rgba(0,0,0,0.15)", pointerEvents: "none",
                  }}
                >
                  {h.label}
                </div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
