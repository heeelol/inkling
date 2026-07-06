import { describe, it, expect } from "vitest";
import { pickBackdrop } from "./composite";

describe("pickBackdrop", () => {
  it("returns the url when present", () => {
    expect(pickBackdrop("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
  });
  it("returns the cream fallback token when null", () => {
    expect(pickBackdrop(null)).toBe("CREAM_FALLBACK");
  });
});
