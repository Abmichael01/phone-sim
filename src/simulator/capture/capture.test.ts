import { describe, expect, it } from "vitest";
import { captureFileName, fileTimestamp } from "./files";
import { pickRecordingFormat } from "./recorder";
import { cropToViewport } from "./screenshot";

describe("capture helpers", () => {
  it("names files phone-sim-<device>-<YYYYMMDD-HHMMSS>.<ext>", () => {
    const date = new Date(2026, 0, 5, 7, 8, 9);
    expect(fileTimestamp(date)).toBe("20260105-070809");
    expect(captureFileName("iphone-16-pro", date, "png")).toBe("phone-sim-iphone-16-pro-20260105-070809.png");
  });

  it("prefers mp4, then vp9 webm, then plain webm", () => {
    expect(pickRecordingFormat(() => true)).toEqual({ mimeType: "video/mp4;codecs=avc1", extension: "mp4" });
    expect(pickRecordingFormat((type) => type.startsWith("video/webm"))).toEqual({
      mimeType: "video/webm;codecs=vp9",
      extension: "webm",
    });
    expect(pickRecordingFormat((type) => type === "video/webm").mimeType).toBe("video/webm");
    expect(pickRecordingFormat(() => false)).toEqual({ mimeType: "", extension: "webm" });
  });

  it("crops to the visible viewport", () => {
    const viewport = { width: 1000, height: 800 };
    expect(cropToViewport({ x: 100, y: 50, width: 400, height: 600 }, viewport)).toEqual({ x: 100, y: 50, width: 400, height: 600 });
    expect(cropToViewport({ x: -50, y: 700, width: 200, height: 300 }, viewport)).toEqual({ x: 0, y: 700, width: 150, height: 100 });
    expect(cropToViewport({ x: 1200, y: 0, width: 10, height: 10 }, viewport)).toBeNull();
  });
});
