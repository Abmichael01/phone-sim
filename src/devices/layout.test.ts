import { describe, expect, it } from "vitest";
import { resolveDevice } from "./index";
import {
  antennaBands,
  BUTTON_OVERHANG,
  bezels,
  browserBarHeights,
  fitScale,
  frameLayout,
  frameStyle,
  MIN_SCALE,
  multiStageSize,
  rotateSize,
  sideButtons,
  STAGE_GAP,
  statusBarHeight,
  stepZoom,
  zoomScale,
} from "./layout";

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
    expect(layout.viewport).toEqual({ x: 0, y: 44, width: 390, height: 844 - 44 });
    expect(layout.body).toEqual({ width: 390 + 34, height: 844 + 34 });
    expect(layout.screen).toEqual({ x: 17, y: 17, width: 390, height: 844 });
    expect(layout.outer).toEqual({ width: 424 + BUTTON_OVERHANG * 2, height: 878 + BUTTON_OVERHANG * 2 });
  });

  it("swaps sizes in landscape", () => {
    const layout = frameLayout(resolveDevice("iphone-14"), "landscape");
    expect(layout.viewport).toEqual({ x: 0, y: 0, width: 844, height: 390 });
    expect(layout.body).toEqual({ width: 878, height: 424 });
    expect(layout.portraitBody).toEqual({ width: 424, height: 878 });
  });

  it("keeps the tablet status bar in landscape", () => {
    const layout = frameLayout(resolveDevice("ipad-pro-11"), "landscape");
    expect(layout.viewport).toEqual({ x: 0, y: 24, width: 1194, height: 834 - 24 });
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

describe("browser bars", () => {
  const withBars = { statusBar: true, browserBars: true };

  it("adds Safari bars on iPhone (top address bar, bottom toolbar + home indicator)", () => {
    const layout = frameLayout(resolveDevice("iphone-16-pro"), "portrait", withBars);
    expect(layout.bars).toEqual({ top: 44, bottom: 58 });
    expect(layout.viewport).toEqual({ x: 0, y: 54 + 44, width: 402, height: 874 - 54 - 44 - 58 });
  });

  it("uses a shorter toolbar on home-button iPhones", () => {
    expect(browserBarHeights(resolveDevice("iphone-se-3"), "portrait")).toEqual({ top: 44, bottom: 46 });
  });

  it("gives iPad Safari a single top bar", () => {
    const layout = frameLayout(resolveDevice("ipad-pro-11"), "landscape", withBars);
    expect(layout.bars).toEqual({ top: 50, bottom: 0 });
    expect(layout.viewport.height).toBe(834 - 24 - 50);
  });

  it("gives Android Chrome a top toolbar and a gesture bar", () => {
    const layout = frameLayout(resolveDevice("pixel-8"), "portrait", withBars);
    expect(layout.bars).toEqual({ top: 56, bottom: 20 });
    expect(layout.viewport.height).toBe(915 - 28 - 56 - 20);
  });

  it("keeps only a slim top bar on landscape phones", () => {
    expect(browserBarHeights(resolveDevice("iphone-16-pro"), "landscape")).toEqual({ top: 36, bottom: 0 });
    expect(browserBarHeights(resolveDevice("pixel-8"), "landscape")).toEqual({ top: 40, bottom: 0 });
    const layout = frameLayout(resolveDevice("pixel-8"), "landscape", withBars);
    expect(layout.viewport).toEqual({ x: 0, y: 40, width: 915, height: 412 - 40 });
  });

  it("drops the status bar when it is switched off", () => {
    const layout = frameLayout(resolveDevice("iphone-16-pro"), "portrait", { statusBar: false, browserBars: false });
    expect(layout.statusBar).toBe(0);
    expect(layout.viewport).toEqual({ x: 0, y: 0, width: 402, height: 874 });
  });
});

describe("frame style", () => {
  it("fills defaults for entries without style fields", () => {
    expect(frameStyle(resolveDevice("moto-g4"))).toEqual({
      edge: "rounded",
      rim: 3.5,
      chin: 0,
      antennaBands: false,
      buttons: "android",
      hinge: null,
    });
    expect(frameStyle(resolveDevice("galaxy-a51")).buttons).toBe("samsung");
    expect(frameStyle(resolveDevice("ipad-10")).buttons).toBe("tablet");
    expect(frameStyle(resolveDevice("galaxy-z-fold-6-unfolded")).hinge).toBe("center");
    expect(frameStyle(resolveDevice("galaxy-z-fold-6")).hinge).toBe("left");
  });

  it("adds the chin to the bottom bezel", () => {
    const device = resolveDevice("pixel-9-pro");
    expect(bezels(device).bottom - bezels(device).top).toBe(2);
  });

  it("places family-specific buttons", () => {
    const cameraControl = sideButtons(resolveDevice("iphone-16-pro")).filter((button) => button.variant === "camera-control");
    expect(cameraControl).toHaveLength(1);
    expect(sideButtons(resolveDevice("iphone-15-pro")).some((button) => button.variant === "camera-control")).toBe(false);
    const pixel = sideButtons(resolveDevice("pixel-9-pro"));
    expect(pixel.every((button) => button.edge === "right")).toBe(true);
    // Pixel: power above volume (shorter button first); Samsung: volume above power.
    expect(pixel[0]!.length).toBeLessThan(pixel[1]!.length);
    const samsung = sideButtons(resolveDevice("galaxy-s24-ultra"));
    expect(samsung[0]!.length).toBeGreaterThan(samsung[1]!.length);
  });

  it("draws antenna bands only where the catalog asks for them", () => {
    expect(antennaBands(resolveDevice("iphone-13")).length).toBeGreaterThan(0);
    expect(antennaBands(resolveDevice("galaxy-s24"))).toEqual([]);
  });
});

describe("stepZoom", () => {
  it("steps between fixed levels from the current scale", () => {
    expect(stepZoom(0.62, "in")).toBe("75");
    expect(stepZoom(0.62, "out")).toBe("50");
    expect(stepZoom(0.75, "in")).toBe("100");
    expect(stepZoom(1, "in")).toBe("100");
    expect(stepZoom(0.5, "out")).toBe("50");
  });
});

describe("multiStageSize", () => {
  it("combines side-by-side device boxes with a horizontal gap", () => {
    expect(multiStageSize([])).toEqual({ width: 0, height: 0 });
    expect(multiStageSize([{ width: 400, height: 800 }])).toEqual({ width: 400, height: 800 });
    expect(
      multiStageSize([
        { width: 430, height: 900 },
        { width: 880, height: 1250 },
      ]),
    ).toEqual({ width: 430 + 880 + STAGE_GAP, height: 1250 });
  });
});
