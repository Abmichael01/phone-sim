import { describe, expect, it } from "vitest";
import { resolveDevice } from "./index";
import { BUTTON_OVERHANG, bezels, fitScale, frameLayout, MIN_SCALE, rotateSize, statusBarHeight, zoomScale } from "./layout";

describe("statusBarHeight", () => {
  it("depends on the cutout in portrait", () => {
    expect(statusBarHeight(resolveDevice("iphone-16-pro"), "portrait")).toBe(54);
    expect(statusBarHeight(resolveDevice("iphone-13"), "portrait")).toBe(44);
    expect(statusBarHeight(resolveDevice("pixel-8"), "portrait")).toBe(28);
    expect(statusBarHeight(resolveDevice("iphone-se-3"), "portrait")).toBe(20);
    expect(statusBarHeight(resolveDevice("ipad-pro-11"), "portrait")).toBe(24);
  });

  it("is hidden for phones in landscape but kept for tablets", () => {
    expect(statusBarHeight(resolveDevice("iphone-16-pro"), "landscape")).toBe(0);
    expect(statusBarHeight(resolveDevice("galaxy-z-fold-6-unfolded"), "landscape")).toBe(0);
    expect(statusBarHeight(resolveDevice("ipad-pro-11"), "landscape")).toBe(24);
  });
});

describe("frameLayout", () => {
  it("gives the iframe the screen minus the status bar in portrait", () => {
    const layout = frameLayout(resolveDevice("iphone-14"), "portrait");
    expect(layout.viewport).toEqual({ width: 390, height: 844 - 44 });
    expect(layout.body).toEqual({ width: 390 + 24, height: 844 + 24 });
    expect(layout.screen).toEqual({ x: 12, y: 12, width: 390, height: 844 });
    expect(layout.outer).toEqual({ width: 414 + BUTTON_OVERHANG * 2, height: 868 + BUTTON_OVERHANG * 2 });
  });

  it("swaps sizes in landscape", () => {
    const layout = frameLayout(resolveDevice("iphone-14"), "landscape");
    expect(layout.viewport).toEqual({ width: 844, height: 390 });
    expect(layout.body).toEqual({ width: 868, height: 414 });
    expect(layout.portraitBody).toEqual({ width: 414, height: 868 });
  });

  it("keeps the tablet status bar in landscape", () => {
    const layout = frameLayout(resolveDevice("ipad-pro-11"), "landscape");
    expect(layout.viewport).toEqual({ width: 1194, height: 834 - 24 });
  });

  it("moves the home-button forehead to the left in landscape", () => {
    const device = resolveDevice("iphone-8");
    const edges = bezels(device);
    expect(edges.top).toBeGreaterThan(edges.side);
    expect(frameLayout(device, "landscape").screen).toMatchObject({ x: edges.top, y: edges.side });
  });
});

describe("scaling", () => {
  it("rotates sizes", () => {
    expect(rotateSize({ width: 1, height: 2 }, "landscape")).toEqual({ width: 2, height: 1 });
    expect(rotateSize({ width: 1, height: 2 }, "portrait")).toEqual({ width: 1, height: 2 });
  });

  it("fits within the available space and never enlarges", () => {
    expect(fitScale({ width: 400, height: 800 }, { width: 1000, height: 400 })).toBe(0.5);
    expect(fitScale({ width: 400, height: 800 }, { width: 2000, height: 2000 })).toBe(1);
    expect(fitScale({ width: 400, height: 800 }, { width: 0, height: 0 })).toBe(MIN_SCALE);
  });

  it("maps fixed zoom levels", () => {
    const content = { width: 400, height: 800 };
    const available = { width: 100, height: 100 };
    expect(zoomScale("100", content, available)).toBe(1);
    expect(zoomScale("75", content, available)).toBe(0.75);
    expect(zoomScale("50", content, available)).toBe(0.5);
    expect(zoomScale("fit", content, available)).toBe(0.125);
  });
});
