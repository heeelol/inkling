"use client";
import { motion } from "motion/react";
import { SeedCards } from "./SeedCards";

const DOODLES = [
  { e: "⚔️", top: "12%", left: "8%", cls: "float-slow", rot: "-8deg", size: 48 },
  { e: "🌒", top: "18%", left: "84%", cls: "float-mid", rot: "10deg", size: 44 },
  { e: "🕯️", top: "68%", left: "6%", cls: "float-mid", rot: "6deg", size: 38 },
  { e: "🐉", top: "74%", left: "88%", cls: "float-slow", rot: "-10deg", size: 50 },
  { e: "🏰", top: "40%", left: "92%", cls: "float-slow", rot: "8deg", size: 42 },
  { e: "🗝️", top: "44%", left: "3%", cls: "float-mid", rot: "-12deg", size: 38 },
];

const STEPS = [
  { e: "🕯️", t: "Choose your path", d: "Every choice is remembered — forever." },
  { e: "🎒", t: "Pack your bag", d: "Loot is real: fit it in a 6×4 grid or leave it behind." },
  { e: "📜", t: "Bind your saga", d: "Finish and keep an illustrated chronicle." },
];

export function Landing() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, padding: "48px 24px" }}>
      {DOODLES.map((d, i) => (
        <span
          key={i}
          className={`no-print ${d.cls}`}
          aria-hidden
          style={{ position: "absolute", top: d.top, left: d.left, fontSize: d.size, opacity: 0.45, ["--rot" as string]: d.rot, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.4))" }}
        >
          {d.e}
        </span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ textAlign: "center", position: "relative", zIndex: 1 }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "var(--crayon)", marginBottom: 14 }} className="glass">
          🕯️ an AI-woven adventure that remembers everything
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(56px, 11vw, 104px)", lineHeight: 0.95, margin: 0, fontWeight: 700, color: "var(--sunny)", letterSpacing: 1, textShadow: "0 4px 24px rgba(212,169,78,0.35)" }}>
          Inkling
        </h1>
        <p style={{ fontSize: "clamp(18px, 2.4vw, 24px)", color: "var(--paper)", marginTop: 12, fontWeight: 500 }}>
          Forge your legend — one dark choice at a time.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, position: "relative", zIndex: 1 }}
      >
        {STEPS.map((s, i) => (
          <div key={i} className="glass" style={{ width: 200, borderRadius: 18, padding: "14px 16px", boxShadow: "var(--shadow-soft)" }}>
            <div style={{ fontSize: 28 }}>{s.e}</div>
            <div className="font-display" style={{ fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{s.t}</div>
            <div style={{ fontSize: 13, color: "#6d5c42", marginTop: 2, lineHeight: 1.35 }}>{s.d}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}
      >
        <SeedCards />
      </motion.div>
    </main>
  );
}
