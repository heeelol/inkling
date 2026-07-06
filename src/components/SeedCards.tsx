"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SEEDS = [
  { emoji: "🐉", text: "a dragon who is afraid of the dark" },
  { emoji: "🏰", text: "a lighthouse at the end of the world" },
  { emoji: "🐱", text: "a little cat who wants to fly" },
  { emoji: "🚪", text: "a secret door in the garden" },
  { emoji: "🐙", text: "a friendly octopus who loves to paint" },
  { emoji: "🌙", text: "a bunny who visits the moon" },
];

export function SeedCards() {
  const router = useRouter();
  const [text, setText] = useState("");
  const go = (premise: string) => {
    const p = premise.trim();
    if (!p) return;
    router.push(`/play?seed=${encodeURIComponent(p)}`);
  };
  return (
    <div style={{ width: "min(720px, 92vw)", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {SEEDS.map((s) => (
          <button
            key={s.text}
            onClick={() => go(s.text)}
            style={{
              display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              background: "#fff", border: "3px solid var(--sunny)", borderRadius: 18,
              padding: "14px 16px", fontSize: 16, color: "var(--ink)", cursor: "pointer",
              boxShadow: "0 4px 0 rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: 26 }}>{s.emoji}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go(text)}
          placeholder="…or dream up your own story"
          style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "2px solid #e0cba0", fontSize: 16 }}
        />
        <button
          onClick={() => go(text)}
          style={{
            background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14,
            padding: "12px 22px", fontSize: 16, fontWeight: 700, cursor: "pointer",
          }}
        >
          Begin ✨
        </button>
      </div>
    </div>
  );
}
