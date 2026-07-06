# Inkling 🖍️📖

**Draw yourself into the story.** An illustrated, AI-driven choose-your-own-adventure for kids and families where the child both *chooses* what happens next and *draws* elements directly into the world — and the story and art react to their drawing.

## What it does
- Pick a story seed (or dream up your own).
- Each turn: read (or hear) a short storybook beat, illustrated in a warm crayon style.
- Make a choice **or draw** something onto the scene — a friend, a bridge, a key. A vision model reads your drawing and the story weaves it in; your real crayon marks become part of the picture.
- Finish anytime to get a printable illustrated **storybook** of your whole adventure.

## Why
It lets kids (and grown-ups who "can't draw or write") create a beautiful, personal, illustrated story and feel like its author and artist. Every generated passage and image passes a moderation guardrail to keep it kid-safe.

## Tech
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
- Motion (page turns), perfect-freehand (crayon canvas)
- OpenAI: story (structured outputs), vision (reads drawings), `gpt-image-1` (crayon backdrops), moderation (kid-safety), TTS (read-aloud)

## Run locally
1. `npm install`
2. Create `.env.local` with `OPENAI_API_KEY=sk-...`
3. `npm run dev` and open http://localhost:3000

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build
- `npm test` — unit tests (Vitest)
- `npm run lint` — lint
