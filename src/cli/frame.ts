import { BUTTON_OVERHANG, bezels, bodyRadius, cutoutSize, frameStyle, rotateSize, sideButtons, type Rect, type Size } from "@/devices/layout";
import type { Device } from "@/schemas/device";
import type { Orientation } from "@/schemas/settings";
import { overlayHtml, type Overlay } from "./overlay";

/**
 * HTML for a CSS-drawn device around a screenshot, built from the same catalog
 * numbers and geometry helpers the extension's frame uses. Playwright renders
 * it and screenshots `#device` with a transparent background.
 */

export interface FrameInput {
  device: Device;
  orientation: Orientation;
  /** Screenshot as a data: URL. */
  image: string;
  /** CSS size of the screenshot (taller than the screen for full-page shots). */
  content: Size;
  /** Numbered issue boxes drawn over the screenshot. */
  overlay?: Overlay | undefined;
}

const DOCUMENT_START =
  '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}#device{position:relative}</style></head><body>';

/** The screenshot with its overlay only (for --no-frame). */
export function screenHtml(input: Omit<FrameInput, "device" | "orientation">): string {
  const width = Math.round(input.content.width);
  const height = Math.round(input.content.height);
  return [
    DOCUMENT_START,
    `<div id="device" style="width:${width}px;height:${height}px;overflow:hidden">`,
    `<img alt="" src="${input.image}" style="position:absolute;left:0;top:0;display:block;width:${width}px;height:${height}px">`,
    input.overlay ? overlayHtml(input.overlay) : "",
    "</div></body></html>",
  ].join("");
}

export interface FrameGeometry {
  /** Whole drawing including side-button overhang. */
  outer: Size;
  /** Body box, relative to `outer`. */
  body: Rect;
  /** Screen glass, relative to the body. */
  screen: Rect;
  /** How much taller than the real screen the drawing is (full-page shots). */
  extra: number;
}

const SAFE_COLOR = /^[#a-z0-9(),.%\s-]+$/i;
const DEFAULT_COLOR = "#1d1d1f";

export function safeColor(color: string): string {
  return SAFE_COLOR.test(color) ? color : DEFAULT_COLOR;
}

function portraitBody(device: Device): Size {
  const edges = bezels(device);
  return { width: device.screen.width + edges.side * 2, height: device.screen.height + edges.top + edges.bottom };
}

export function frameGeometry(device: Device, orientation: Orientation, content: Size): FrameGeometry {
  const edges = bezels(device);
  const baseScreen = rotateSize(device.screen, orientation);
  const extra = Math.max(0, Math.round(content.height) - baseScreen.height);
  const baseBody = rotateSize(portraitBody(device), orientation);
  // Landscape = turned a quarter counter-clockwise: the top bezel ends up on the left.
  const screen: Rect =
    orientation === "portrait"
      ? { x: edges.side, y: edges.top, width: baseScreen.width, height: baseScreen.height + extra }
      : { x: edges.top, y: edges.side, width: baseScreen.width, height: baseScreen.height + extra };
  const body: Rect = { x: BUTTON_OVERHANG, y: BUTTON_OVERHANG, width: baseBody.width, height: baseBody.height + extra };
  return {
    outer: { width: body.width + BUTTON_OVERHANG * 2, height: body.height + BUTTON_OVERHANG * 2 },
    body,
    screen,
    extra,
  };
}

/** Maps a rect drawn on the upright item (width `uprightWidth`) to the current orientation. */
export function orient(rect: Rect, orientation: Orientation, uprightWidth: number): Rect {
  if (orientation === "portrait") return rect;
  return { x: rect.y, y: uprightWidth - rect.x - rect.width, width: rect.height, height: rect.width };
}

interface Shape extends Rect {
  style: string;
}

function box(shape: Shape): string {
  const r = (value: number) => Math.round(value * 100) / 100;
  return `<div style="position:absolute;left:${r(shape.x)}px;top:${r(shape.y)}px;width:${r(shape.width)}px;height:${r(shape.height)}px;${shape.style}"></div>`;
}

/** Camera cutout shapes in upright screen coordinates. */
function cutoutShapes(device: Device): Shape[] {
  const { width, height } = cutoutSize(device);
  const screenWidth = device.screen.width;
  const center = (screenWidth - width) / 2;
  switch (device.frame.cutout) {
    case "dynamic-island":
      return [{ x: center, y: 11, width, height, style: `background:#000;border-radius:${height / 2}px` }];
    case "notch":
      return [{ x: center, y: 0, width, height, style: "background:#000;border-radius:0 0 20px 20px" }];
    case "punch-hole-center":
      return [{ x: center, y: 9, width, height, style: "background:#000;border-radius:50%" }];
    case "punch-hole-left":
      return [{ x: 18, y: 9, width, height, style: "background:#000;border-radius:50%" }];
    case "waterdrop":
      return [{ x: (screenWidth - 22) / 2, y: 0, width: 22, height: 20, style: "background:#000;border-radius:0 0 11px 11px" }];
    case "home-button":
    case "none":
      return [];
  }
}

/** What hides parts of the screenshot once framed: rounded corners and the camera cutout (screen coordinates). */
export function screenObstacles(device: Device, orientation: Orientation): { cornerRadius: number; avoid: Rect[] } {
  return {
    cornerRadius: device.frame.screenRadius,
    avoid: cutoutShapes(device).map(({ x, y, width, height }) => orient({ x, y, width, height }, orientation, device.screen.width)),
  };
}

/** Side buttons, home button and earpiece in upright body coordinates. */
function hardwareShapes(device: Device, color: string): { behind: Shape[]; front: Shape[] } {
  const body = portraitBody(device);
  const edges = bezels(device);
  const behind = sideButtons(device).map((button): Shape => {
    const along = button.edge === "top" ? body.width : body.height;
    const start = button.start * along;
    const length = button.length * along;
    const look =
      button.variant === "camera-control"
        ? "background:#2a2a2e;border-radius:2px"
        : `background:${color};filter:brightness(0.8);border-radius:2px`;
    const thickness = BUTTON_OVERHANG + 2;
    if (button.edge === "left") return { x: -BUTTON_OVERHANG, y: start, width: thickness, height: length, style: look };
    if (button.edge === "right") return { x: body.width - 2, y: start, width: thickness, height: length, style: look };
    return { x: start, y: -BUTTON_OVERHANG, width: length, height: thickness, style: look };
  });
  const front: Shape[] = [];
  if (device.frame.cutout === "home-button") {
    const diameter = Math.round(Math.min(edges.bottom * 0.6, device.screen.width * 0.17));
    front.push({
      x: (body.width - diameter) / 2,
      y: edges.top + device.screen.height + (edges.bottom - diameter) / 2,
      width: diameter,
      height: diameter,
      style: "border-radius:50%;background:#0b0b0d;box-shadow:inset 0 0 0 2px rgba(160,160,170,0.35)",
    });
    const slit = Math.round(device.screen.width * 0.14);
    front.push({
      x: (body.width - slit) / 2,
      y: edges.top / 2 - 2,
      width: slit,
      height: 5,
      style: "border-radius:3px;background:#1b1c20",
    });
    front.push({
      x: body.width / 2 - slit / 2 - 18,
      y: edges.top / 2 - 4,
      width: 9,
      height: 9,
      style: "border-radius:50%;background:#101018",
    });
  }
  return { behind, front };
}

/** Full HTML document with the framed screenshot in `#device`. */
export function frameHtml(input: FrameInput): string {
  const { device, orientation } = input;
  const geometry = frameGeometry(device, orientation, input.content);
  const { body, screen, extra } = geometry;
  const color = safeColor(device.frame.color);
  const rim = frameStyle(device).rim;
  const radius = bodyRadius(device);
  const uprightBodyWidth = portraitBody(device).width;
  const baseScreenBottom = screen.y + screen.height - extra;

  /** Upright body shape → current orientation; things below the real screen move down with a full-page extension. */
  const place = (shape: Shape): Shape => {
    const rect = orient(shape, orientation, uprightBodyWidth);
    const shifted = rect.y >= baseScreenBottom ? { ...rect, y: rect.y + extra } : rect;
    return { ...shifted, style: shape.style };
  };
  const hardware = hardwareShapes(device, color);
  const cutouts = cutoutShapes(device).map((shape) => ({
    ...orient(shape, orientation, device.screen.width),
    style: shape.style,
  }));

  const glassRadius = Math.max(0, radius - rim);
  const parts = [
    ...hardware.behind.map(place).map(box),
    `<div style="position:absolute;left:0;top:0;width:${body.width}px;height:${body.height}px;border-radius:${radius}px;background:linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0) 35%,rgba(0,0,0,0.22) 100%),${color};box-shadow:0 0 0 0.5px rgba(0,0,0,0.5)">`,
    `<div style="position:absolute;inset:${rim}px;border-radius:${glassRadius}px;background:#050506;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06)"></div>`,
    ...hardware.front.map(place).map(box),
    `<div style="position:absolute;left:${screen.x}px;top:${screen.y}px;width:${screen.width}px;height:${screen.height}px;border-radius:${device.frame.screenRadius}px;overflow:hidden;background:#000">`,
    `<img alt="" src="${input.image}" style="position:absolute;left:0;top:0;display:block;width:${Math.round(input.content.width)}px;height:${Math.round(input.content.height)}px">`,
    input.overlay ? overlayHtml(input.overlay) : "",
    ...cutouts.map(box),
    `<div style="position:absolute;inset:0;border-radius:${device.frame.screenRadius}px;border:1px solid #000"></div>`,
    "</div>",
    "</div>",
  ];

  return [
    DOCUMENT_START,
    `<div id="device" style="width:${geometry.outer.width}px;height:${geometry.outer.height}px">`,
    `<div style="position:absolute;left:${body.x}px;top:${body.y}px;width:${body.width}px;height:${body.height}px">`,
    ...parts,
    "</div></div></body></html>",
  ].join("");
}
