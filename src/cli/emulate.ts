import { rotateSize, statusBarHeight, type Size } from "@/devices/layout";
import { buildUserAgent, clientHints } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";
import type { Orientation } from "@/schemas/settings";

/** The subset of Playwright's BrowserContextOptions this tool sets (kept local so this module stays pure). */
export interface EmulationOptions {
  viewport: Size;
  screen: Size;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  userAgent: string;
  locale: string;
  extraHTTPHeaders: Record<string, string>;
}

/**
 * Every catalog device honours the viewport meta tag, iPads included: iPadOS
 * Safari sends a Mac User-Agent (desktop sites) but still lays pages out by
 * the tag, and zooms wider pages out to fit. Playwright's `isMobile` is that
 * switch, so it is on for all devices; the Mac User-Agent stays for iPads.
 */
export function emulatesMobile(_device: Device): boolean {
  return true;
}

/** iPad Safari: desktop-class browsing (desktop sites, Mac User-Agent). */
export function isDesktopClass(device: Device): boolean {
  return device.platform === "ipados";
}

/**
 * Browser-context options for one device. The viewport is the full screen size
 * (no toolbar subtracted): widths are exact, heights are a little taller than
 * a real browser's visible area.
 */
export function emulationFor(device: Device, orientation: Orientation, chromeMajor: number): EmulationOptions {
  const size = rotateSize(device.screen, orientation);
  const hints = clientHints(device);
  return {
    viewport: size,
    screen: size,
    deviceScaleFactor: device.dpr,
    isMobile: emulatesMobile(device),
    hasTouch: true,
    userAgent: buildUserAgent(device, chromeMajor),
    locale: "en-US",
    // Same client hints the extension sends, so server-side device detection agrees with the User-Agent.
    extraHTTPHeaders: { "sec-ch-ua-mobile": hints.mobile, "sec-ch-ua-platform": hints.platform },
  };
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const NO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/** Whether something covers part of the screen edge (camera cutout). */
export function hasScreenCutout(device: Device): boolean {
  const { cutout } = device.frame;
  return cutout !== "none" && cutout !== "home-button";
}

/** Home indicator height on gesture iPhones and iPads (iOS draws it over the page). */
const HOME_INDICATOR = 34;
const IPAD_HOME_INDICATOR = 20;

/**
 * env(safe-area-inset-*) values the device reports when the page uses
 * viewport-fit=cover. The top inset is the status bar height used by the frame.
 */
export function safeAreaInsets(device: Device, orientation: Orientation): SafeAreaInsets {
  const homeBar = device.platform === "ipados" ? IPAD_HOME_INDICATOR : device.platform === "ios" ? HOME_INDICATOR : 0;
  const bottom = device.frame.cutout === "home-button" ? 0 : homeBar;
  if (orientation === "portrait") {
    return { ...NO_INSETS, top: statusBarHeight(device, "portrait"), bottom };
  }
  if (device.kind === "tablet") return { ...NO_INSETS, top: statusBarHeight(device, "landscape"), bottom };
  // Landscape phone: the camera side is on the left, the home bar shrinks.
  const side = hasScreenCutout(device) ? statusBarHeight(device, "portrait") : 0;
  return { top: 0, bottom: bottom > 0 ? 21 : 0, left: side, right: device.platform === "ios" ? side : 0 };
}

/** Chrome major version from Playwright's `browser.version()` ("140.0.7339.16"). */
export function chromeMajorFrom(version: string, fallback: number): number {
  const major = Number.parseInt(version, 10);
  return Number.isInteger(major) && major > 0 ? major : fallback;
}
