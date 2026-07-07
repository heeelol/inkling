export const CRAYON_STYLE_PRESET =
  "children's storybook illustration, chunky wax-crayon textures, warm and cozy, " +
  "simple friendly shapes, soft cream paper background, bright primary crayon colors, " +
  "no text, no words, gentle and non-scary";

export const STORY_SYSTEM = [
  "You are the storyteller for Inkling, an interactive picture book for young children (ages 4-9).",
  "Rules:",
  "- Keep each beat SHORT: 2-4 simple sentences at an early-reader level.",
  "- Always wholesome and age-appropriate. Mild, cozy storybook peril only. Never violence, horror, or anything scary or sad beyond a gentle moment.",
  "- Offer 2-3 choices, each a short friendly action label (max ~5 words).",
  "- If the child has drawn something into the story, acknowledge it warmly and weave it into what happens next.",
  "- imagePrompt: describe ONLY the visible scene for an illustrator, in one vivid sentence. No characters speaking, no text.",
  "- newCharacters: any NEW named characters introduced this beat. newDrawnItems: leave empty unless the child just drew something.",
].join("\n");

export const VISION_SYSTEM =
  "You look at a child's simple crayon drawing and describe what they drew in 1 short phrase " +
  "(e.g. 'a wobbly red boat', 'a smiling yellow sun'). Be generous and imaginative about rough sketches. Reply with only the phrase.";

// Instruction appended when the child contributed a drawing, so the image model
// reinterprets their rough sketch as polished crayon art rather than leaving a
// distracting doodle pasted on top of the scene.
export function buildDrawingIntegration(description?: string): string {
  const what = description ? `the child's drawing of ${description}` : "the child's drawing";
  return (
    `The reference image contains ${what} as a rough crayon sketch. ` +
    `Reinterpret that sketch as a polished element that belongs in the illustration — ` +
    `keep its shape, colors and roughly its position, but redraw it cleanly in the same storybook crayon style, ` +
    `blended naturally into the scene. Do not leave the raw sketch untouched or floating on top.`
  );
}

// Appended when a previous illustration is handed to the image model, so
// recurring characters and settings stay visually consistent page to page.
export function buildContinuity(): string {
  return (
    "One reference image is the previous page of this storybook. " +
    "Keep any recurring characters, their outfits, and the overall setting visually consistent with it, " +
    "in the same crayon storybook style — but show the NEW moment described above."
  );
}

export function buildStoryUserPrompt(summary: string, action: string, drawingDescription?: string): string {
  const drew = drawingDescription ? `\nTHE CHILD JUST DREW: ${drawingDescription}` : "";
  return `${summary}\n\nTHE CHILD CHOSE: ${action}${drew}\n\nContinue the story for the next beat.`;
}
