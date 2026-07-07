// Pure helpers for karaoke-style narration highlighting.
// Kept out of the component so the word-tracking math is unit-testable.

/** Split into tokens, preserving whitespace runs so the text re-renders exactly. */
export function tokenize(text: string): string[] {
  return text.split(/(\s+)/);
}

export const isSpace = (tk: string) => /^\s+$/.test(tk);

/**
 * Index (into tokenize() output) of the word being spoken at `progress` (0..1),
 * weighting words by character length. -1 when nothing is active yet.
 */
export function activeTokenIndex(text: string, progress: number): number {
  const tokens = tokenize(text);
  const totalChars = text.replace(/\s+/g, "").length;
  if (!totalChars || progress <= 0) return -1;
  const target = Math.min(1, progress) * totalChars;
  let seen = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (isSpace(tokens[i])) continue;
    seen += tokens[i].length;
    if (seen >= target) return i;
  }
  return tokens.length - 1;
}
