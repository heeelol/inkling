"use client";
import type { CSSProperties } from "react";

type Props = {
  label: string;
  emoji: string;
  /** "badge" = small pill for the picture corner, "inline" = larger block in the panel */
  variant?: "badge" | "inline";
};

/**
 * Animated "working…" indicator: a wiggling emoji, bouncing dots, and an
 * indeterminate progress bar — so children (and grown-ups) can tell the app is
 * busy rather than frozen while the AI thinks and paints.
 */
export function LoadingIndicator({ label, emoji, variant = "inline" }: Props) {
  const isBadge = variant === "badge";

  const wrap: CSSProperties = isBadge
    ? {
        position: "absolute", top: 10, left: 10, background: "rgba(255,253,245,0.92)",
        borderRadius: 16, padding: "6px 12px 8px", color: "var(--ink)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)", minWidth: 132,
        display: "flex", flexDirection: "column", gap: 5,
      }
    : { display: "flex", flexDirection: "column", gap: 8, color: "#a08b6a" };

  return (
    <div style={wrap} role="status" aria-live="polite">
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: isBadge ? 13 : 16, fontWeight: 700 }}>
        <span className="inkling-wiggle" aria-hidden>{emoji}</span>
        <span>
          {label}
          <span className="inkling-dots" aria-hidden><i>.</i><i>.</i><i>.</i></span>
        </span>
      </div>
      <div className="inkling-bar" style={isBadge ? undefined : { maxWidth: 220 }} />
    </div>
  );
}
