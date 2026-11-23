import type { Cutout, Device } from "@/schemas/device";
import type { Orientation, Zoom } from "@/schemas/settings";

/** Pure frame geometry, all in CSS px. Nothing here touches the DOM. */

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** How far the side buttons stick out of the body. */
export const BUTTON_OVERHANG = 3;

/** Smallest scale "Fit" will use, so tiny windows still show something. */
export const MIN_SCALE = 0.1;

/** Height of the status bar strip reserved at the top of the screen, portrait. */
const STATUS_BAR_HEIGHT: Record<Cutout, number> = {
  "dynamic-island": 54,
  notch: 44,
  "punch-hole-center": 28,
  "punch-hole-left": 28,
  waterdrop: 28,
  "home-button": 20,
  none: 24,
};

/** Phones and foldables hide the status bar in landscape (as iOS does); tablets keep it. */
export function statusBarHeight(device: Device, orientation: Orientation): number {
  if (orientation === "landscape" && device.kind !== "tablet") return 0;
  return STATUS_BAR_HEIGHT[device.frame.cutout];
}

export function rotateSize(size: Size, orientation: Orientation): Size {
  return orientation === "portrait"
    ? { width: size.width, height: size.height }
    : { width: size.height, height: size.width };
}

export interface Bezels {
  top: number;
  bottom: number;
  side: number;
}

/** Bezels in portrait. Home-button devices get a tall forehead and chin. */
export function bezels(device: Device): Bezels {
  const { bezel, cutout } = device.frame;
  if (cutout !== "home-button") return { top: bezel, bottom: bezel, side: bezel };
  const ratio = device.kind === "tablet" ? 0.115 : 0.15;
  const chin = Math.max(bezel, Math.round(device.screen.height * ratio));
  return { top: chin, bottom: chin, side: bezel };
}

/** Outer corner radius of the body. */
export function bodyRadius(device: Device): number {
  if (device.frame.cutout === "home-button") {
    const ratio = device.kind === "tablet" ? 0.05 : 0.15;
    return Math.round(device.screen.width * ratio);
  }
  return device.frame.screenRadius + device.frame.bezel;
}

export interface FrameLayout {
  orientation: Orientation;
  /** Body drawn upright; the decorative layer is drawn this way and rotated. */
  portraitBody: Size;
  /** Body in the current orientation. */
  body: Size;
  /** Body plus button overhang on every side: the box that gets scaled. */
  outer: Size;
  /** Screen glass inside the body, current orientation. */
  screen: Rect;
  /** Reserved status bar strip at the top of the screen. */
  statusBar: number;
  /** CSS size of the site's viewport (the iframe). */
  viewport: Size;
  bodyRadius: number;
  bezels: Bezels;
}

export function frameLayout(device: Device, orientation: Orientation): FrameLayout {
  const edges = bezels(device);
  const portraitBody: Size = {
    width: device.screen.width + edges.side * 2,
    height: device.screen.height + edges.top + edges.bottom,
  };
  const body = rotateSize(portraitBody, orientation);
  const screenSize = rotateSize(device.screen, orientation);
  // Landscape = device turned a quarter counter-clockwise: its top edge ends up on the left.
  const screen: Rect =
    orientation === "portrait"
      ? { x: edges.side, y: edges.top, ...screenSize }
      : { x: edges.top, y: edges.side, ...screenSize };
  const statusBar = statusBarHeight(device, orientation);
  return {
    orientation,
    portraitBody,
    body,
    outer: { width: body.width + BUTTON_OVERHANG * 2, height: body.height + BUTTON_OVERHANG * 2 },
    screen,
    statusBar,
    viewport: { width: screenSize.width, height: screenSize.height - statusBar },
    bodyRadius: bodyRadius(device),
    bezels: edges,
  };
}

/** Largest scale (never above 1) at which `content` fits inside `available`. */
export function fitScale(content: Size, available: Size): number {
  if (content.width <= 0 || content.height <= 0) return 1;
  const scale = Math.min(available.width / content.width, available.height / content.height, 1);
  return Math.max(scale, MIN_SCALE);
}

export function zoomScale(zoom: Zoom, content: Size, available: Size): number {
  return zoom === "fit" ? fitScale(content, available) : Number(zoom) / 100;
}

export interface SideButton {
  /** Edge of the upright (portrait) body the button sits on. */
  edge: "left" | "right" | "top";
  /** Where the button starts along that edge, as a fraction of the edge length. */
  start: number;
  /** Button length as a fraction of the edge length. */
  length: number;
}

/** Volume / power / action buttons, placed the way each device family has them. */
export function sideButtons(device: Device): SideButton[] {
  if (device.kind === "tablet") {
    return [
      { edge: "top", start: 0.8, length: 0.06 },
      { edge: "right", start: 0.07, length: 0.05 },
      { edge: "right", start: 0.13, length: 0.05 },
    ];
  }
  if (device.platform === "ios") {
    return [
      { edge: "left", start: 0.15, length: 0.035 },
      { edge: "left", start: 0.22, length: 0.07 },
      { edge: "left", start: 0.31, length: 0.07 },
      { edge: "right", start: 0.25, length: 0.11 },
    ];
  }
  return [
    { edge: "right", start: 0.2, length: 0.12 },
    { edge: "right", start: 0.36, length: 0.07 },
  ];
}

/** Size of the cutout drawn at the top of the portrait screen (0×0 when there is none). */
export function cutoutSize(device: Device): Size {
  switch (device.frame.cutout) {
    case "dynamic-island":
      return { width: 124, height: 36 };
    case "notch":
      // iPhone 13 and later have a narrower notch than the X / 11 generation.
      return { width: Math.round(device.screen.width * (device.frame.screenRadius >= 44 ? 0.42 : 0.55)), height: 30 };
    case "punch-hole-center":
    case "punch-hole-left":
      return { width: 12, height: 12 };
    case "waterdrop":
      return { width: 40, height: 22 };
    case "home-button":
    case "none":
      return { width: 0, height: 0 };
  }
}
