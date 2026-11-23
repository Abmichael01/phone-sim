import { describe, expect, it } from "vitest";
import { resolveDevice } from "./index";
import { buildFrameEnv, buildUserAgent, clientHints, detectChromeMajor, FALLBACK_CHROME_MAJOR } from "./userAgent";

describe("buildUserAgent", () => {
  it("builds an iPhone Safari UA with the OS version", () => {
    expect(buildUserAgent(resolveDevice("iphone-15"), 140)).toBe(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    );
    expect(buildUserAgent(resolveDevice("iphone-x"), 140)).toContain("CPU iPhone OS 16_7 like Mac OS X");
  });

  it("freezes the OS token at 18_6 from iOS 26 while Safari's version moves on", () => {
    const ua = buildUserAgent(resolveDevice("iphone-17-pro"), 140);
    expect(ua).toContain("CPU iPhone OS 18_6 like Mac OS X");
    expect(ua).toContain("Version/26.0 Mobile/15E148");
  });

  it("makes iPads look like a Mac, as iPadOS Safari does", () => {
    expect(buildUserAgent(resolveDevice("ipad-air-11-m2"), 140)).toBe(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    );
  });

  it("uses Chrome's reduced Android UA with the browser's own major version", () => {
    expect(buildUserAgent(resolveDevice("pixel-8"), 142)).toBe(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
    );
  });

  it("drops 'Mobile' for Android tablets", () => {
    const ua = buildUserAgent(resolveDevice("galaxy-tab-s9"), 142);
    expect(ua).not.toContain("Mobile");
    expect(ua).toContain("Chrome/142.0.0.0 Safari/537.36");
  });

  it("prefers an explicit userAgent from the catalog", () => {
    const device = { ...resolveDevice("pixel-8"), userAgent: "Custom/1.0" };
    expect(buildUserAgent(device, 142)).toBe("Custom/1.0");
  });
});

describe("clientHints", () => {
  it("marks phones and foldables mobile, tablets not", () => {
    expect(clientHints(resolveDevice("pixel-8"))).toEqual({ mobile: "?1", platform: '"Android"' });
    expect(clientHints(resolveDevice("galaxy-z-fold-5-unfolded")).mobile).toBe("?1");
    expect(clientHints(resolveDevice("iphone-16"))).toEqual({ mobile: "?1", platform: '"iOS"' });
    expect(clientHints(resolveDevice("ipad-pro-11"))).toEqual({ mobile: "?0", platform: '"macOS"' });
  });
});

describe("detectChromeMajor", () => {
  it("reads the Chromium brand first", () => {
    const brands = [
      { brand: "Opera GX", version: "120" },
      { brand: "Chromium", version: "136" },
      { brand: "Not.A/Brand", version: "99" },
    ];
    expect(detectChromeMajor({ userAgent: "", userAgentData: { brands } })).toBe(136);
  });

  it("falls back to the UA string, then to a constant", () => {
    expect(detectChromeMajor({ userAgent: "Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36" })).toBe(131);
    expect(detectChromeMajor({ userAgent: "Mozilla/5.0" })).toBe(FALLBACK_CHROME_MAJOR);
  });
});

describe("buildFrameEnv", () => {
  it("carries everything mobile-env.js validates", () => {
    const env = buildFrameEnv(resolveDevice("pixel-8"), 140, "abcdefghijklmnopabcdefghijklmnop");
    expect(env).toMatchObject({ phoneSim: 1, platform: "android", mobile: true, touch: true, osVersion: "15" });
    expect(JSON.parse(JSON.stringify(env))).toEqual(env);
  });
});
