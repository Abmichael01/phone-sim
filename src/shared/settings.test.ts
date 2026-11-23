import { describe, expect, it } from "vitest";
import { DEFAULT_DEVICE_ID } from "@/devices";
import { DEFAULT_SETTINGS } from "@/schemas/settings";
import { parseSettings } from "./settings";

describe("parseSettings", () => {
  it("returns defaults for missing or non-object data", () => {
    for (const raw of [undefined, null, "settings", 42, [], true]) {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it("keeps valid values", () => {
    const saved = { deviceId: "pixel-8", orientation: "landscape", zoom: "75", screenshotMode: "screen", sidebarOpen: false };
    expect(parseSettings(saved)).toEqual(saved);
  });

  it("replaces only the invalid fields with defaults", () => {
    expect(
      parseSettings({ deviceId: "Not An Id!", orientation: "sideways", zoom: 3, screenshotMode: "screen", sidebarOpen: "yes" }),
    ).toEqual({ ...DEFAULT_SETTINGS, deviceId: DEFAULT_DEVICE_ID, screenshotMode: "screen" });
  });

  it("fills missing fields and drops unknown ones", () => {
    expect(parseSettings({ zoom: "50", theme: "pink" })).toEqual({ ...DEFAULT_SETTINGS, zoom: "50" });
  });
});
