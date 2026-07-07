"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

const SEEDS = [
  { emoji: "🏰", text: "a knight sworn to a dying king", tint: "var(--sky)" },
  { emoji: "🐺", text: "hunted through the Blackbriar woods", tint: "var(--coral)" },
  { emoji: "🗡️", text: "the last blade of a fallen house", tint: "var(--sunny)" },
  { emoji: "🕯️", text: "a necromancer's apprentice with cold feet", tint: "var(--grape)" },
  { emoji: "🐉", text: "a dragon owes you a debt", tint: "var(--mint)" },
  { emoji: "⛏️", text: "lost in the deep mines of Morr", tint: "var(--rose)" },
];

export function SeedCards() {
  const router = useRouter();
  const [text, setText] = useState("");
  const go = (premise: string) => {
    const p = premise.trim();
    if (!p) return;
    router.push(`/play?seed=${encodeURIComponent(p)}`);
  };
  const surprise = () => go(SEEDS[Math.floor(text.length + SEEDS.length * 0.7) % SEEDS.length].text);

  return (
    <div style={{ width: "min(760px, 92vw)", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {SEEDS.map((s, i) => (
          <motion.button
            key={s.text}
            onClick={() => go(s.text)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              background: "var(--paper)", border: "2px solid rgba(212,169,78,0.5)", borderRadius: 16,
              padding: "14px 16px", fontSize: 15.5, color: "var(--ink)", cursor: "pointer",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <span style={{ fontSize: 24, width: 46, height: 46, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: s.tint }}>{s.emoji}</span>
            <span style={{ fontWeight: 500 }}>{s.text}</span>
          </motion.button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go(text)}
          placeholder="…or whisper your own dark premise"
          style={{ flex: 1, minWidth: 200, padding: "13px 16px", borderRadius: 14, border: "2px solid rgba(212,169,78,0.5)", fontSize: 16, background: "var(--paper)", color: "var(--ink)" }}
        />
        <button
          onClick={surprise}
          title="Tempt fate"
          style={{ background: "var(--paper)", color: "var(--ink)", border: "2px solid rgba(212,169,78,0.5)", borderRadius: 14, padding: "12px 16px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
        >
          🎲 Tempt fate
        </button>
        <motion.button
          onClick={() => go(text)}
          whileTap={{ scale: 0.96 }}
          style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
        >
          Begin ⚔️
        </motion.button>
      </div>
    </div>
  );
}
