import type { Device, Platform } from "@/schemas/device";

/** Used only if the browser hides its own version (never expected in Chromium). */
export const FALLBACK_CHROME_MAJOR = 140;

interface NavigatorLike {
  readonly userAgent: string;
  readonly userAgentData?: { readonly brands: readonly NavigatorUABrandVersion[] };
}

/**
 * The Chromium major version of the browser running the extension, so the
 * simulated Android User-Agent stays as current as the user's own browser.
 */
export function detectChromeMajor(nav: NavigatorLike): number {
  const brand = nav.userAgentData?.brands.find(({ brand: name }) => name === "Chromium" || name === "Google Chrome");
  const fromBrand = brand ? Number.parseInt(brand.version, 10) : Number.NaN;
  if (Number.isInteger(fromBrand) && fromBrand > 0) return fromBrand;
  const match = /(?:Chrome|Chromium)\/(\d+)/.exec(nav.userAgent);
  const fromUa = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isInteger(fromUa) && fromUa > 0 ? fromUa : FALLBACK_CHROME_MAJOR;
}

interface AppleVersion {
  /** Token in "CPU iPhone OS 18_0 like Mac OS X". */
  os: string;
  /** Token in "Version/18.0". */
  safari: string;
}

/**
 * Safari 26 froze the OS token in its User-Agent at 18_6, while the Safari
 * version keeps moving. Earlier versions report the real OS version.
 */
const FROZEN_IOS_TOKEN = "18_6";
const FIRST_FROZEN_IOS_MAJOR = 26;

function appleVersion(osVersion: string): AppleVersion {
  const [majorText = "18", minorText = "0"] = osVersion.split(".");
  const major = Number.parseInt(majorText, 10);
  const minor = Number.parseInt(minorText, 10);
  const safeMajor = Number.isInteger(major) ? major : 18;
  const safeMinor = Number.isInteger(minor) ? minor : 0;
  return {
    os: safeMajor >= FIRST_FROZEN_IOS_MAJOR ? FROZEN_IOS_TOKEN : `${safeMajor}_${safeMinor}`,
    safari: `${safeMajor}.${safeMinor}`,
  };
}

/** Phones and foldables are "mobile"; tablets get desktop-class or tablet pages. */
export function isMobileDevice(device: Device): boolean {
  return device.kind !== "tablet";
}

/** The User-Agent a real browser on this device sends. */
export function buildUserAgent(device: Device, chromeMajor: number): string {
  if (device.userAgent) return device.userAgent;
  switch (device.platform) {
    case "ios": {
      const version = appleVersion(device.osVersion);
      return `Mozilla/5.0 (iPhone; CPU iPhone OS ${version.os} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version.safari} Mobile/15E148 Safari/604.1`;
    }
    case "ipados": {
      // iPadOS Safari requests desktop sites by presenting itself as a Mac.
      const version = appleVersion(device.osVersion);
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version.safari} Safari/605.1.15`;
    }
    case "android": {
      // Chrome's reduced User-Agent: Android version and model are frozen to "10; K".
      const mobile = isMobileDevice(device) ? "Mobile " : "";
      return `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 ${mobile}Safari/537.36`;
    }
  }
}

export interface ClientHints {
  /** Sec-CH-UA-Mobile structured-header boolean. */
  mobile: "?1" | "?0";
  /** Sec-CH-UA-Platform structured-header string (quotes included). */
  platform: string;
}

const CLIENT_HINT_PLATFORM: Record<Platform, string> = {
  android: '"Android"',
  ios: '"iOS"',
  // Matches the Mac User-Agent iPadOS Safari sends.
  ipados: '"macOS"',
};

export function clientHints(device: Device): ClientHints {
  return {
    mobile: isMobileDevice(device) ? "?1" : "?0",
    platform: CLIENT_HINT_PLATFORM[device.platform],
  };
}

/**
 * Settings handed to mobile-env.js through the simulator iframe's `name`.
 * mobile-env.ts re-declares and validates this shape because it cannot import.
 */
export interface FrameEnv {
  phoneSim: 1;
  /** Extension id; the frame's top ancestor must be chrome-extension://<ext>. */
  ext: string;
  ua: string;
  platform: Platform;
  mobile: boolean;
  touch: true;
  osVersion: string;
}

export function buildFrameEnv(device: Device, chromeMajor: number, extensionId: string): FrameEnv {
  return {
    phoneSim: 1,
    ext: extensionId,
    ua: buildUserAgent(device, chromeMajor),
    platform: device.platform,
    mobile: isMobileDevice(device),
    touch: true,
    osVersion: device.osVersion,
  };
}
