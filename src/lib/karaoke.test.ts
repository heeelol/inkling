import { describe, it, expect } from "vitest";
import { activeTokenIndex, tokenize, isSpace } from "./karaoke";

const TEXT = "The brave little cat flew";

describe("activeTokenIndex", () => {
  it("returns -1 before speech starts", () => {
    expect(activeTokenIndex(TEXT, 0)).toBe(-1);
  });
  it("highlights the first word early on", () => {
    const i = activeTokenIndex(TEXT, 0.05);
    expect(tokenize(TEXT)[i]).toBe("The");
  });
  it("reaches the last word at full progress", () => {
    const i = activeTokenIndex(TEXT, 1);
    expect(tokenize(TEXT)[i]).toBe("flew");
  });
  it("clamps progress above 1", () => {
    expect(activeTokenIndex(TEXT, 5)).toBe(activeTokenIndex(TEXT, 1));
  });
  it("advances monotonically with progress", () => {
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.1) {
      const i = activeTokenIndex(TEXT, p);
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
  });
  it("handles empty text", () => {
    expect(activeTokenIndex("", 0.5)).toBe(-1);
  });
  it("never marks whitespace tokens active", () => {
    for (let p = 0.05; p <= 1; p += 0.05) {
      const i = activeTokenIndex(TEXT, p);
      expect(isSpace(tokenize(TEXT)[i])).toBe(false);
    }
  });
});
