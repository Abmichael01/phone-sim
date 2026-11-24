import { describe, expect, it } from "vitest";
import { MAX_CUSTOM_BACKGROUNDS } from "@/schemas/customBackground";
import { parseCustomBackgrounds } from "./customBackgrounds";

const VALID_DATA_URL = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";

describe("parseCustomBackgrounds", () => {
  it("returns empty array for invalid top-level input", () => {
    for (const raw of [undefined, null, "bad", 123, {}]) {
      expect(parseCustomBackgrounds(raw)).toEqual([]);
    }
  });

  it("drops invalid/duplicate entries, rejects non-image URLs, and caps at MAX_CUSTOM_BACKGROUNDS", () => {
    const items = [
      { id: "custom-bg-1", name: "Desk setup", dataUrl: VALID_DATA_URL },
      { id: "custom-bg-1", name: "Duplicate", dataUrl: VALID_DATA_URL },
      { id: "bad-id", name: "Wrong prefix", dataUrl: VALID_DATA_URL },
      { id: "custom-bg-xss", name: "SVG blocked", dataUrl: "data:image/svg+xml;base64,PHN2Zz4=" },
      { id: "custom-bg-url", name: "Remote blocked", dataUrl: "https://example.com/a.jpg" },
      ...Array.from({ length: MAX_CUSTOM_BACKGROUNDS + 2 }, (_, i) => ({
        id: `custom-bg-extra-${i}`,
        name: `Photo ${i}`,
        dataUrl: VALID_DATA_URL,
      })),
    ];
    const parsed = parseCustomBackgrounds(items);
    expect(parsed).toHaveLength(MAX_CUSTOM_BACKGROUNDS);
    expect(parsed[0]?.id).toBe("custom-bg-1");
  });
});
