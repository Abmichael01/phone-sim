import { describe, expect, it } from "vitest";
import { getDevice } from "@/devices";
import { BUTTON_OVERHANG, bezels, bodyRadius } from "@/devices/layout";
import type { Device } from "@/schemas/device";
import { frameGeometry, frameHtml, orient, safeColor, screenHtml, screenObstacles } from "./frame";

function device(id: string): Device {
  const found = getDevice(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

const IMAGE = "data:image/png;base64,AAAA";

describe("frameGeometry", () => {
  it("wraps the screen in the catalog bezels plus button overhang", () => {
    const iphone = device("iphone-16-pro");
    const edges = bezels(iphone);
    const geometry = frameGeometry(iphone, "portrait", iphone.screen);
    expect(geometry.screen).toEqual({ x: edges.side, y: edges.top, width: 402, height: 874 });
    expect(geometry.outer).toEqual({
      width: 402 + edges.side * 2 + BUTTON_OVERHANG * 2,
      height: 874 + edges.top + edges.bottom + BUTTON_OVERHANG * 2,
    });
    expect(geometry.extra).toBe(0);
  });

  it("turns the body for landscape (top bezel on the left)", () => {
    const se = device("iphone-se-3");
    const edges = bezels(se);
    const geometry = frameGeometry(se, "landscape", { width: 667, height: 375 });
    expect(geometry.screen).toMatchObject({ x: edges.top, y: edges.side, width: 667, height: 375 });
  });

  it("grows taller for full-page screenshots", () => {
    const pixel = device("pixel-9");
    const geometry = frameGeometry(pixel, "portrait", { width: 412, height: 3000 });
    expect(geometry.extra).toBe(3000 - 923);
    expect(geometry.screen.height).toBe(3000);
  });
});

describe("orient", () => {
  it("rotates a rect a quarter counter-clockwise", () => {
    const rect = { x: 10, y: 20, width: 30, height: 5 };
    expect(orient(rect, "portrait", 100)).toBe(rect);
    expect(orient(rect, "landscape", 100)).toEqual({ x: 20, y: 60, width: 5, height: 30 });
  });
});

describe("frameHtml", () => {
  it("draws the body from catalog numbers around the screenshot", () => {
    const iphone = device("iphone-16-pro");
    const html = frameHtml({ device: iphone, orientation: "portrait", image: IMAGE, content: iphone.screen });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('id="device"');
    expect(html).toContain(`src="${IMAGE}"`);
    expect(html).toContain(`border-radius:${bodyRadius(iphone)}px`);
    expect(html).toContain(`border-radius:${iphone.frame.screenRadius}px`);
    expect(html).toContain(iphone.frame.color);
    expect(html).toContain("background:transparent");
    // Dynamic Island pill.
    expect(html).toContain("border-radius:18px");
  });

  it("draws a home button for the iPhone SE and no cutout", () => {
    const html = frameHtml({ device: device("iphone-se-3"), orientation: "portrait", image: IMAGE, content: { width: 375, height: 667 } });
    expect(html).toContain("border-radius:50%;background:#0b0b0d");
  });

  it("draws the issue overlay over the screenshot, under the camera cutout", () => {
    const iphone = device("iphone-16-pro");
    const overlay = { boxes: [{ rect: { x: 1, y: 2, width: 3, height: 4 }, color: "#e5484d" }], badges: [{ number: 5, x: 0, y: 0, color: "#e5484d" }] };
    const html = frameHtml({ device: iphone, orientation: "portrait", image: IMAGE, content: iphone.screen, overlay });
    const image = html.indexOf(IMAGE);
    const box = html.indexOf("left:1px;top:2px");
    expect(image).toBeGreaterThan(-1);
    expect(box).toBeGreaterThan(image);
    expect(html.indexOf("border-radius:18px")).toBeGreaterThan(box);
  });

  it("renders a bare annotated screenshot for --no-frame", () => {
    const html = screenHtml({ image: IMAGE, content: { width: 402, height: 874 }, overlay: { boxes: [], badges: [{ number: 2, x: 0, y: 0, color: "#f5a524" }] } });
    expect(html).toContain('id="device" style="width:402px;height:874px');
    expect(html).toContain(">2</div>");
  });

  it("never lets a catalog colour break out of the style attribute", () => {
    expect(safeColor("#1d1d1f")).toBe("#1d1d1f");
    expect(safeColor("rgb(1, 2, 3)")).toBe("rgb(1, 2, 3)");
    expect(safeColor('red;"><script>')).toBe("#1d1d1f");
  });
});

describe("screenObstacles", () => {
  it("returns the screen radius and the cutout in screen coordinates", () => {
    const iphone = device("iphone-16-pro");
    expect(screenObstacles(iphone, "portrait")).toEqual({
      cornerRadius: iphone.frame.screenRadius,
      avoid: [{ x: (402 - 124) / 2, y: 11, width: 124, height: 36 }],
    });
    expect(screenObstacles(device("iphone-se-3"), "portrait").avoid).toEqual([]);
    expect(screenObstacles(iphone, "landscape").avoid[0]).toMatchObject({ x: 11, width: 36, height: 124 });
  });
});
