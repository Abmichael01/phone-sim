import { describe, expect, it } from "vitest";
import { getDevice } from "@/devices";
import { buildUserAgent } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";
import { chromeMajorFrom, emulatesMobile, emulationFor, hasScreenCutout, isDesktopClass, safeAreaInsets } from "./emulate";

function device(id: string): Device {
  const found = getDevice(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe("emulationFor", () => {
  it("maps an iPhone to a mobile, touch, full-screen viewport at its pixel ratio", () => {
    const iphone = device("iphone-16-pro");
    expect(emulationFor(iphone, "portrait", 140)).toEqual({
      viewport: { width: 402, height: 874 },
      screen: { width: 402, height: 874 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: buildUserAgent(iphone, 140),
      locale: "en-US",
      extraHTTPHeaders: { "sec-ch-ua-mobile": "?1", "sec-ch-ua-platform": '"iOS"' },
    });
  });

  it("swaps width and height in landscape", () => {
    const options = emulationFor(device("pixel-9"), "landscape", 140);
    expect(options.viewport).toEqual({ width: 923, height: 412 });
    expect(options.userAgent).toContain("Chrome/140.0.0.0 Mobile");
  });

  it("honours the viewport tag on every device, with a Mac User-Agent for desktop-class iPads", () => {
    const ipad = device("ipad-mini-a17-pro");
    expect(emulatesMobile(ipad)).toBe(true);
    expect(isDesktopClass(ipad)).toBe(true);
    expect(isDesktopClass(device("iphone-16-pro"))).toBe(false);
    const options = emulationFor(ipad, "portrait", 140);
    expect(options.isMobile).toBe(true);
    expect(options.userAgent).toContain("Macintosh");
    expect(options.extraHTTPHeaders["sec-ch-ua-mobile"]).toBe("?0");
    const androidTablet = device("galaxy-tab-s9");
    expect(emulatesMobile(androidTablet)).toBe(true);
    expect(emulationFor(androidTablet, "portrait", 140).hasTouch).toBe(true);
  });
});

describe("safe area", () => {
  it("knows which devices have a camera cutout", () => {
    expect(hasScreenCutout(device("iphone-16-pro"))).toBe(true);
    expect(hasScreenCutout(device("pixel-9"))).toBe(true);
    expect(hasScreenCutout(device("iphone-se-3"))).toBe(false);
    expect(hasScreenCutout(device("ipad-mini-a17-pro"))).toBe(false);
  });

  it("reports notch and home-bar insets like the device", () => {
    expect(safeAreaInsets(device("iphone-16-pro"), "portrait")).toEqual({ top: 54, bottom: 34, left: 0, right: 0 });
    expect(safeAreaInsets(device("iphone-se-3"), "portrait")).toEqual({ top: 20, bottom: 0, left: 0, right: 0 });
    expect(safeAreaInsets(device("iphone-16-pro"), "landscape")).toEqual({ top: 0, bottom: 21, left: 54, right: 54 });
    expect(safeAreaInsets(device("pixel-9"), "portrait").bottom).toBe(0);
  });
});

describe("chromeMajorFrom", () => {
  it("reads the major version or falls back", () => {
    expect(chromeMajorFrom("156.0.8078.4", 140)).toBe(156);
    expect(chromeMajorFrom("", 140)).toBe(140);
  });
});
