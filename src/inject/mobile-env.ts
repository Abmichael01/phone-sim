/**
 * Mobile environment for sites shown inside the Phone Sim frame.
 *
 * Registered by the background for every frame at document_start in the MAIN
 * world, so it must stay inert everywhere else. It only acts when ALL hold:
 *   1. this window is a frame whose single ancestor is a chrome-extension:// page;
 *   2. window.name is the JSON payload the simulator puts on its iframe;
 *   3. that payload's extension id matches the ancestor origin.
 * It then reports the frame's URL to the simulator and makes navigator,
 * touch detection and pointer/hover media queries look like the device.
 *
 * Standalone on purpose: no imports, so the built file is a plain script.
 * Keep FrameEnv and MESSAGE_SOURCE in sync with src/devices/userAgent.ts and
 * src/shared/messages.ts.
 */
(() => {
  if (window.top === window) return;

  const ancestors = location.ancestorOrigins;
  const parentOrigin = ancestors.length === 1 ? ancestors[0] : undefined;
  if (!parentOrigin || !parentOrigin.startsWith("chrome-extension://")) return;

  type Platform = "ios" | "ipados" | "android";

  interface FrameEnv {
    ext: string;
    ua: string;
    platform: Platform;
    mobile: boolean;
    touch: boolean;
    osVersion: string;
  }

  const MESSAGE_SOURCE = "phone-sim:frame";

  function readEnv(name: string): FrameEnv | null {
    if (!name.startsWith("{")) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(name);
    } catch {
      return null;
    }
    if (typeof parsed !== "object" || parsed === null) return null;
    const data = parsed as Record<string, unknown>;
    const { phoneSim, ext, ua, platform, mobile, touch, osVersion } = data;
    if (phoneSim !== 1) return null;
    if (typeof ext !== "string" || !/^[a-p]{32}$/.test(ext)) return null;
    if (typeof ua !== "string" || ua.length === 0 || ua.length > 512) return null;
    if (platform !== "ios" && platform !== "ipados" && platform !== "android") return null;
    if (typeof mobile !== "boolean" || typeof touch !== "boolean") return null;
    if (typeof osVersion !== "string" || !/^\d+(\.\d+)*$/.test(osVersion)) return null;
    return { ext, ua, platform, mobile, touch, osVersion };
  }

  const env = readEnv(window.name);
  if (!env || parentOrigin !== `chrome-extension://${env.ext}`) return;

  // Tell the simulator where the frame is, so its URL bar follows navigation.
  const report = (): void => {
    window.parent.postMessage({ source: MESSAGE_SOURCE, href: location.href }, parentOrigin);
  };
  report();
  window.addEventListener("hashchange", report);
  window.addEventListener("popstate", report);
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method];
    history[method] = function patchedHistory(this: History, ...args: Parameters<History["pushState"]>): void {
      original.apply(this, args);
      report();
    };
  }

  /** Overrides a getter; a property the browser refuses to redefine keeps its real value. */
  function defineGetter(target: object, key: string, value: unknown): void {
    try {
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get: () => value });
    } catch {
      // Non-configurable in this browser build: the real value stays visible.
    }
  }

  const isApple = env.platform !== "android";
  const navigatorPlatform: Record<Platform, string> = { ios: "iPhone", ipados: "MacIntel", android: "Linux armv81" };
  const proto = Navigator.prototype;

  defineGetter(proto, "userAgent", env.ua);
  defineGetter(proto, "appVersion", env.ua.replace(/^Mozilla\//, ""));
  defineGetter(proto, "platform", navigatorPlatform[env.platform]);
  defineGetter(proto, "vendor", isApple ? "Apple Computer, Inc." : "Google Inc.");
  defineGetter(proto, "maxTouchPoints", env.touch ? 5 : 0);

  const realUaData = navigator.userAgentData;
  if (isApple) {
    // Safari has no navigator.userAgentData.
    Reflect.deleteProperty(proto, "userAgentData");
  } else {
    const brands = realUaData ? realUaData.brands : [];
    const lowEntropy: UALowEntropyJSON = { brands, mobile: env.mobile, platform: "Android" };
    const uaData: NavigatorUAData = {
      brands,
      mobile: env.mobile,
      platform: "Android",
      getHighEntropyValues(hints: string[]): Promise<UADataValues> {
        const versions = realUaData
          ? realUaData.getHighEntropyValues(["fullVersionList", "uaFullVersion"])
          : Promise.resolve<UADataValues>({});
        return versions.then((real) => {
          const all: Record<string, unknown> = {
            architecture: "",
            bitness: "",
            model: "",
            platformVersion: env.osVersion,
            wow64: false,
            fullVersionList: real.fullVersionList ?? brands,
            uaFullVersion: real.uaFullVersion ?? "",
          };
          const result: Record<string, unknown> = { ...lowEntropy };
          for (const hint of hints) if (hint in all) result[hint] = all[hint];
          return result as UADataValues;
        });
      },
      toJSON: () => lowEntropy,
    };
    defineGetter(proto, "userAgentData", uaData);
  }

  if (!env.touch) return;

  // Touch feature detection ("ontouchstart" in window / element).
  const touchHandlers = ["ontouchstart", "ontouchmove", "ontouchend", "ontouchcancel"];
  for (const target of [window, Document.prototype, HTMLElement.prototype]) {
    for (const handler of touchHandlers) {
      if (handler in target) continue;
      try {
        Object.defineProperty(target, handler, { configurable: true, enumerable: true, writable: true, value: null });
      } catch {
        // Already defined by the browser: detection works without our help.
      }
    }
  }

  // matchMedia: a touch screen has a coarse pointer and no hover.
  const ALWAYS = "(width >= 0px)";
  const NEVER = "(width < 0px)";
  const rewrites: ReadonlyArray<readonly [RegExp, string]> = [
    [/\(\s*(?:any-)?pointer\s*:\s*coarse\s*\)/gi, ALWAYS],
    [/\(\s*(?:any-)?pointer\s*:\s*(?:fine|none)\s*\)/gi, NEVER],
    [/\(\s*(?:any-)?pointer\s*\)/gi, ALWAYS],
    [/\(\s*(?:any-)?hover\s*:\s*none\s*\)/gi, ALWAYS],
    [/\(\s*(?:any-)?hover\s*:\s*hover\s*\)/gi, NEVER],
    [/\(\s*(?:any-)?hover\s*\)/gi, NEVER],
  ];
  const realMatchMedia = window.matchMedia.bind(window);
  const matchMedia = (query: string): MediaQueryList => {
    let rewritten = String(query);
    for (const [pattern, replacement] of rewrites) rewritten = rewritten.replace(pattern, replacement);
    return realMatchMedia(rewritten);
  };
  Object.defineProperty(window, "matchMedia", { configurable: true, enumerable: true, writable: true, value: matchMedia });
})();
