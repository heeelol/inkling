# Inkling 🖍️📖

**Draw yourself into the story.** An AI picture book where a child both *chooses* what happens next and *draws* elements straight into the world — and the story, the art, the music, and the narration all react.

## 💡 The idea
Kids love making up stories, but the blank page is scary — and most "AI story" apps make the child a passive listener. Inkling flips that: the child is the **author and the illustrator**. Their wobbly crayon doodle isn't pasted on top of the art; the AI *repaints their idea into the illustration*, keeping its shape, colors, and position. The moment "your drawing came to life! 🪄" is the whole product.

## ⚙️ How it works
1. **Pick a seed** (or dream up your own premise) → the storyteller model writes a short beat with 2–3 choices.
2. **Read or listen** — each beat is auto-narrated (OpenAI TTS) with karaoke word-highlighting, over a generative Web-Audio soundscape that brightens while the AI is "thinking/painting."
3. **Choose or draw.** The drawing canvas has crayon/marker/pencil brushes, 4 sizes, undo, and a pop-up tool tray. You place and resize your drawing as a sticker on the scene, and can describe it in your own words (else a vision model interprets it).
4. **The magic:** the sketch (at its placed position) + the *previous page* are sent to `gpt-image-1`'s edit endpoint — so your idea is painted into the new illustration *and* recurring characters stay visually consistent page to page.
5. **Finish anytime** → an AI-titled, printable storybook with a cover, page numbers, a shareable cover image… and a **Sketchbook appendix** showing each raw doodle beside the painted page it became.

## ✨ Main features
- Drawing → **AI-integrated illustration** (image *edits*, not overlays), with placement control
- **Page-to-page visual continuity** via previous-scene reference
- Auto **voice acting** with word-by-word karaoke highlight; music & voice toggles
- Generative, state-reactive **soundscape + SFX** (pure Web Audio, zero assets)
- Kid-safe: every prompt passes a **moderation guardrail**; gentle redirects
- Polished storybook UI: page cross-fades, sparkle reveals, cast chips, mobile layout
- Export: AI-generated title, print/PDF, native **share sheet** with a rendered cover PNG, sketch-vs-page appendix

## 🧰 Technology stack
- **Next.js 16** (App Router, Turbopack) · **React 19** · TypeScript · Tailwind v4
- **Motion** (animations) · **perfect-freehand** (pressure-sensitive strokes) · Web Audio API
- **OpenAI**: gpt-4o (story w/ structured outputs + vision + titles), `gpt-image-1` (generate + multi-image **edit**), `gpt-4o-mini-tts`, omni-moderation
- Vitest unit tests (`npm test`) — story state, compositing, moderation, karaoke math

## 👧 Intended audience
Children ~4–9 and their parents/teachers: a creative-literacy tool that turns "I can't draw/write" into a finished, printable book the child authored.

## 🚀 Run locally
```bash
npm install
echo OPENAI_API_KEY=sk-... > .env.local
npm run dev   # http://localhost:3000
```
`npm test` runs the unit suite; `npm run build` makes the production build (deployed on Vercel).
