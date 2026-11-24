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

  it("migrates v0.1 settings: keeps their values, adds new defaults, drops sidebarOpen", () => {
    const v01 = { deviceId: "pixel-8", orientation: "landscape", zoom: "75", screenshotMode: "screen", sidebarOpen: false };
    expect(parseSettings(v01)).toEqual({ ...DEFAULT_SETTINGS, deviceId: "pixel-8", orientation: "landscape", zoom: "75", screenshotMode: "screen" });
  });

  it("keeps valid v0.3 values including multi-device slots and sync toggles", () => {
    const saved = {
      ...DEFAULT_SETTINGS,
      theme: "light",
      stageBg: "dark-topo" as const,
      barTheme: "dark" as const,
      demoStatusBar: true,
      transparentFrameShot: false,
      browserBars: false,
      statusBar: false,
      touchCursor: false,
      syncScroll: false,
      syncNav: false,
      recordTarget: "screen" as const,
      autoScrollMode: true,
      autoScrollSpeed: 240,
      autoScrollFromTop: false,
      autoScrollDelayMs: 2000,
      autoScrollStopAtBottom: false,
      screenshotMode: "all" as const,
      slots: [
        { slotId: "slot-a", deviceId: "iphone-16-pro", orientation: "portrait" as const },
        { slotId: "slot-b", deviceId: "pixel-9-pro", orientation: "landscape" as const },
      ],
      recentDeviceIds: ["pixel-8", "iphone-16-pro"],
      finishes: { "iphone-16-pro": "Desert Titanium" },
    };
    expect(parseSettings(saved)).toEqual(saved);
  });

  it("cleans multi-device slots: drops bad/duplicate entries, caps at 4, falls back to Phone + Tablet", () => {
    const parsed = parseSettings({
      slots: [
        { slotId: "s1", deviceId: "pixel-8", orientation: "portrait" },
        { slotId: "s1", deviceId: "iphone-16-pro", orientation: "portrait" },
        { slotId: "BAD!", deviceId: "pixel-8", orientation: "portrait" },
        { slotId: "s2", deviceId: "ipad-pro-11-m4", orientation: "landscape" },
        { slotId: "s3", deviceId: "galaxy-s24-ultra", orientation: "portrait" },
        { slotId: "s4", deviceId: "iphone-13", orientation: "portrait" },
        { slotId: "s5", deviceId: "iphone-se-3", orientation: "portrait" },
      ],
    });
    expect(parsed.slots.map((s) => s.slotId)).toEqual(["s1", "s2", "s3", "s4"]);
    expect(parseSettings({ slots: [] }).slots).toEqual(DEFAULT_SETTINGS.slots);
    expect(parseSettings({ slots: "bad" }).slots).toEqual(DEFAULT_SETTINGS.slots);
  });

  it("replaces only the invalid fields with defaults", () => {
    expect(
      parseSettings({ deviceId: "Not An Id!", orientation: "sideways", zoom: 3, screenshotMode: "screen", theme: "neon", touchCursor: "yes" }),
    ).toEqual({ ...DEFAULT_SETTINGS, deviceId: DEFAULT_DEVICE_ID, screenshotMode: "screen" });
  });

  it("keeps valid custom background ids in stageBg", () => {
    expect(parseSettings({ stageBg: "custom-bg-m1abc-xyz" }).stageBg).toBe("custom-bg-m1abc-xyz");
    expect(parseSettings({ stageBg: "not-a-valid-bg" }).stageBg).toBe(DEFAULT_SETTINGS.stageBg);
  });

  it("cleans the recent list and finishes entry by entry", () => {
    const parsed = parseSettings({
      recentDeviceIds: ["pixel-8", 7, "BAD ID", "pixel-8", "a", "b", "c", "d", "e"],
      finishes: { "pixel-8": "Hazel", "BAD KEY": "x", "iphone-16": 3 },
    });
    expect(parsed.recentDeviceIds).toEqual(["pixel-8", "a", "b", "c", "d"]);
    expect(parsed.finishes).toEqual({ "pixel-8": "Hazel" });
    expect(parseSettings({ recentDeviceIds: "pixel-8", finishes: [] }).recentDeviceIds).toEqual([]);
  });
});
