import type { ButtonLayout, Cutout, Device } from "@/schemas/device";
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

/** How far side buttons stick out of the body. */
export const BUTTON_OVERHANG = 3;

/** Smallest scale "Fit" will use, so tiny windows still show something. */
export const MIN_SCALE = 0.1;

// Frame style (optional catalog fields resolved to concrete values)

export interface FrameStyle {
  edge: "flat" | "rounded";
  rim: number;
  chin: number;
  antennaBands: boolean;
  buttons: ButtonLayout;
  hinge: "left" | "center" | null;
}

function defaultButtons(device: Device): ButtonLayout {
  if (device.kind === "tablet") return "tablet";
  if (device.platform !== "android") return "iphone-switch";
  if (device.brand === "Samsung") return "samsung";
  if (device.brand === "Google") return "pixel";
  return "android";
}

function defaultRim(device: Device): number {
  if (device.frame.cutout === "home-button") return 3;
  return device.kind === "tablet" ? 3 : 3.5;
}

export function frameStyle(device: Device): FrameStyle {
  const { frame } = device;
  return {
    edge: frame.edge ?? "rounded",
    rim: Math.min(frame.rim ?? defaultRim(device), Math.max(1, frame.bezel - 1)),
    chin: frame.chin ?? 0,
    antennaBands: frame.antennaBands ?? false,
    buttons: frame.buttons ?? defaultButtons(device),
    hinge: frame.hinge ?? (frame.crease ? "center" : null),
  };
}

// Status bar and browser bars

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

const isLandscapePhone = (device: Device, orientation: Orientation): boolean =>
  orientation === "landscape" && device.kind !== "tablet";

/** Phones and foldables hide the status bar in landscape (as iOS does); tablets keep it. */
export function statusBarHeight(device: Device, orientation: Orientation): number {
  if (isLandscapePhone(device, orientation)) return 0;
  return STATUS_BAR_HEIGHT[device.frame.cutout];
}

export interface BarHeights {
  top: number;
  bottom: number;
}

/**
 * Browser UI inside the phone: Safari (address bar on top, toolbar + home
 * indicator below), iPad Safari (one top bar) or Chrome (top toolbar, gesture
 * bar below). Landscape phones keep only a slim top bar.
 */
export function browserBarHeights(device: Device, orientation: Orientation): BarHeights {
  const landscapePhone = isLandscapePhone(device, orientation);
  switch (device.platform) {
    case "ios":
      if (landscapePhone) return { top: 36, bottom: 0 };
      return { top: 44, bottom: device.frame.cutout === "home-button" ? 46 : 58 };
    case "ipados":
      return { top: 50, bottom: 0 };
    case "android":
      return landscapePhone ? { top: 40, bottom: 0 } : { top: 56, bottom: 20 };
  }
}

// Body geometry

export interface Bezels {
  top: number;
  bottom: number;
  side: number;
}

/** Bezels in portrait. Home-button devices get a tall forehead and chin; `chin` adds to the bottom. */
export function bezels(device: Device): Bezels {
  const { bezel, cutout } = device.frame;
  const chin = frameStyle(device).chin;
  if (cutout !== "home-button") return { top: bezel, bottom: bezel + chin, side: bezel };
  const ratio = device.kind === "tablet" ? 0.115 : 0.15;
  const forehead = Math.max(bezel, Math.round(device.screen.height * ratio));
  return { top: forehead, bottom: forehead + chin, side: bezel };
}

/** Outer corner radius of the body. */
export function bodyRadius(device: Device): number {
  if (device.frame.cutout === "home-button") {
    const ratio = device.kind === "tablet" ? 0.05 : 0.15;
    return Math.round(device.screen.width * ratio);
  }
  return device.frame.screenRadius + device.frame.bezel;
}

export interface LayoutOptions {
  statusBar: boolean;
  browserBars: boolean;
}

export const BARE_SCREEN: LayoutOptions = { statusBar: true, browserBars: false };

export interface FrameLayout {
  orientation: Orientation;
  /** Body drawn upright; the hardware layer is drawn this way and rotated. */
  portraitBody: Size;
  /** Body in the current orientation. */
  body: Size;
  /** Body plus button overhang on every side: the box that gets scaled. */
  outer: Size;
  /** Screen glass inside the body, current orientation. */
  screen: Rect;
  /** Status bar strip at the top of the screen (0 when hidden). */
  statusBar: number;
  /** Browser bars above and below the site. */
  bars: BarHeights;
  /** The site's viewport (the iframe), relative to the screen. */
  viewport: Rect;
  bodyRadius: number;
  bezels: Bezels;
}

export function frameLayout(device: Device, orientation: Orientation, options: LayoutOptions = BARE_SCREEN): FrameLayout {
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
  const statusBar = options.statusBar ? statusBarHeight(device, orientation) : 0;
  const bars = options.browserBars ? browserBarHeights(device, orientation) : { top: 0, bottom: 0 };
  return {
    orientation,
    portraitBody,
    body,
    outer: { width: body.width + BUTTON_OVERHANG * 2, height: body.height + BUTTON_OVERHANG * 2 },
    screen,
    statusBar,
    bars,
    viewport: {
      x: 0,
      y: statusBar + bars.top,
      width: screenSize.width,
      height: screenSize.height - statusBar - bars.top - bars.bottom,
    },
    bodyRadius: bodyRadius(device),
    bezels: edges,
  };
}

export function rotateSize(size: Size, orientation: Orientation): Size {
  return orientation === "portrait"
    ? { width: size.width, height: size.height }
    : { width: size.height, height: size.width };
}

// Scaling

/** Horizontal gap between devices when multiple devices are open side by side (CSS px at 100% scale). */
export const STAGE_GAP = 32;

/** Combined unscaled bounding box for one or more devices arranged side by side. */
export function multiStageSize(items: readonly Size[], gap = STAGE_GAP): Size {
  if (items.length === 0) return { width: 0, height: 0 };
  let width = 0;
  let height = 0;
  for (const item of items) {
    width += item.width;
    if (item.height > height) height = item.height;
  }
  return { width: width + gap * (items.length - 1), height };
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

const FIXED_ZOOMS: readonly { zoom: Zoom; scale: number }[] = [
  { zoom: "50", scale: 0.5 },
  { zoom: "75", scale: 0.75 },
  { zoom: "100", scale: 1 },
];

/** Next fixed zoom level up or down from the scale currently shown (Ctrl/Cmd + wheel). */
export function stepZoom(currentScale: number, direction: "in" | "out"): Zoom {
  if (direction === "in") {
    return FIXED_ZOOMS.find((level) => level.scale > currentScale + 0.001)?.zoom ?? "100";
  }
  return [...FIXED_ZOOMS].reverse().find((level) => level.scale < currentScale - 0.001)?.zoom ?? "50";
}

// Hardware details

export interface SideButton {
  /** Edge of the upright (portrait) body the button sits on. */
  edge: "left" | "right" | "top";
  /** Where the button starts along that edge, as a fraction of the edge length. */
  start: number;
  /** Button length as a fraction of the edge length. */
  length: number;
  /** Camera Control sits nearly flush and looks like glass. */
  variant: "metal" | "camera-control";
}

const metal = (edge: SideButton["edge"], start: number, length: number): SideButton => ({ edge, start, length, variant: "metal" });

const IPHONE_LEFT: readonly SideButton[] = [metal("left", 0.235, 0.065), metal("left", 0.32, 0.065)];

/** Buttons per family, placed where the real ones are. */
export function sideButtons(device: Device): SideButton[] {
  switch (frameStyle(device).buttons) {
    case "iphone-switch":
      return [metal("left", 0.165, 0.035), ...IPHONE_LEFT, metal("right", 0.265, 0.1)];
    case "iphone-action":
      return [metal("left", 0.17, 0.03), ...IPHONE_LEFT, metal("right", 0.265, 0.1)];
    case "iphone-camera-control":
      return [
        metal("left", 0.17, 0.03),
        ...IPHONE_LEFT,
        metal("right", 0.265, 0.1),
        { edge: "right", start: 0.6, length: 0.075, variant: "camera-control" },
      ];
    case "samsung":
      return [metal("right", 0.22, 0.11), metal("right", 0.36, 0.06)];
    case "pixel":
      return [metal("right", 0.19, 0.06), metal("right", 0.28, 0.11)];
    case "android":
      return [metal("right", 0.2, 0.12), metal("right", 0.36, 0.07)];
    case "tablet":
      return [metal("top", 0.8, 0.06), metal("right", 0.07, 0.05), metal("right", 0.13, 0.05)];
  }
}

/** Antenna line positions on the upright body: fractions along each edge. */
export function antennaBands(device: Device): { edge: "left" | "right" | "top" | "bottom"; at: number }[] {
  if (!frameStyle(device).antennaBands) return [];
  return [
    { edge: "left", at: 0.09 },
    { edge: "right", at: 0.09 },
    { edge: "left", at: 0.91 },
    { edge: "right", at: 0.91 },
    { edge: "top", at: 0.78 },
    { edge: "bottom", at: 0.24 },
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
