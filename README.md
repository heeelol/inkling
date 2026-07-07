# Inkling ⚔️📜

**Forge your legend.** An illustrated, AI-woven dark-fantasy choose-your-own-adventure where every choice is remembered forever — and your bag is never big enough.

## 💡 The idea
Text adventures forget. Inventory screens are lists. Inkling fixes both: a Game Master AI that permanently remembers your characters, oaths, and deeds — and a **spatial grid inventory** (Resident Evil-style) where loot has real shape. A 1×3 sword and a 2×2 shield fight for the same 6×4 bag, so every find is a packing puzzle, and choices in the story can be **locked behind items you actually own**.

## ⚙️ How it works
1. **Pick a premise** ("a knight sworn to a dying king") → the Game Master (gpt-4o, structured outputs) writes a beat with 2–3 choices.
2. Each beat is **illustrated** in dark-fantasy ink & watercolor (`gpt-image-1`), with the *previous scene* passed as an edit reference so characters and settings stay visually consistent.
3. **Auto voice-acting** (OpenAI TTS) with karaoke word-highlighting, over a generative A-minor Web-Audio drone that brightens while the fates weave.
4. **Loot is real.** The GM grants items with grid footprints (1–3 cells per side). Auto-packed when possible; when the bag is full you must rotate, rearrange, or abandon treasure. Items get consumed (`removeItems`) when used.
5. Some choices show **🔒 needs Moon-Blade** — playable only if it's in your bag. "Use" any item to hand it to the GM.
6. **Poke the picture** — a vision pass finds characters in each illustration; hover/tap and they wiggle to life.
7. **Bind your saga** → AI-titled, printable chronicle with cover, every page, and the full event log; share a rendered cover PNG.

## ✨ Main features
- **Permanent world memory**: characters, chronicle events, and your full choice history feed every prompt
- **Spatial min-max inventory**: 6×4 grid, rotation, collision, first-fit auto-packing (pure, unit-tested engine)
- **Item-gated choices** + GM-driven item consumption
- Page-to-page **visual continuity** via image edits
- Karaoke **voice acting**, reactive soundscape, living-picture hotspots
- Moderation guardrail on every prompt; spam-safe audio (generation-counter dedupe)
- Export: AI saga title, print/PDF, share sheet with rendered cover, event chronicle

## 🧰 Technology stack
- **Next.js 16** (App Router, Turbopack) · **React 19** · TypeScript · Tailwind v4
- **Motion** (animations) · Web Audio API (zero-asset soundtrack)
- **OpenAI**: gpt-4o (GM + vision hotspots + titles, structured outputs), `gpt-image-1` (generate + edit), `gpt-4o-mini-tts`, omni-moderation
- **Vitest**: 23 unit tests — inventory geometry, story state, schema, karaoke math, moderation

## 🎯 Intended audience
Fans of interactive fiction, D&D, and roguelikes who want a zero-setup, illustrated, voiced adventure that actually remembers what they did.

## 🚀 Run locally
```bash
npm install
echo OPENAI_API_KEY=sk-... > .env.local
npm run dev   # http://localhost:3000
```
`npm test` runs the suite; deployed on Vercel (push to `master`).
