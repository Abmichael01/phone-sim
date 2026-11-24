/**
 * Mobile environment for sites shown inside the Phone Sim frame.
 *
 * Registered by the background for every frame at document_start in the MAIN
 * world, so it must stay inert everywhere else. It only acts when ALL hold:
 *   1. this window is a frame whose single ancestor is a chrome-extension:// page;
 *   2. window.name is the JSON payload the simulator puts on its iframe;
 *   3. that payload's extension id matches the ancestor origin.
 * It then reports the frame's URL to the simulator, obeys back / forward /
 * config commands from it, makes navigator, touch detection and pointer/hover
 * media queries look like the device, and (when enabled) shows a finger cursor
 * and scrolls the page by dragging.
 *
 * Standalone on purpose: no imports, so the built file is a plain script.
 * Keep FrameEnv and the message shapes in sync with src/devices/userAgent.ts
 * and src/shared/messages.ts.
 */
(() => {
  if (window.top === window) return;

  const ancestors = location.ancestorOrigins;
  const parentOrigin = ancestors.length === 1 ? ancestors[0] : undefined;
  if (!parentOrigin || !parentOrigin.startsWith("chrome-extension://")) return;

  type Platform = "ios" | "ipados" | "android";
  type Nav = "load" | "push" | "replace" | "pop";

  interface FrameEnv {
    ext: string;
    ua: string;
    platform: Platform;
    mobile: boolean;
    touch: boolean;
    osVersion: string;
    cursor: boolean;
    syncScroll: boolean;
  }

  const FRAME_SOURCE = "phone-sim:frame";
  const PARENT_SOURCE = "phone-sim:parent";

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
    const { phoneSim, ext, ua, platform, mobile, touch, osVersion, cursor, syncScroll } = data;
    if (phoneSim !== 1) return null;
    if (typeof ext !== "string" || !/^[a-p]{32}$/.test(ext)) return null;
    if (typeof ua !== "string" || ua.length === 0 || ua.length > 512) return null;
    if (platform !== "ios" && platform !== "ipados" && platform !== "android") return null;
    if (typeof mobile !== "boolean" || typeof touch !== "boolean" || typeof cursor !== "boolean") return null;
    if (typeof syncScroll !== "boolean") return null;
    if (typeof osVersion !== "string" || !/^\d+(\.\d+)*$/.test(osVersion)) return null;
    return { ext, ua, platform, mobile, touch, osVersion, cursor, syncScroll };
  }

  const env = readEnv(window.name);
  if (!env || parentOrigin !== `chrome-extension://${env.ext}`) return;

  // Navigation reports, so the simulator's address and back/forward buttons follow the site.

  let suppressNavReport = false;
  const report = (nav: Nav): void => {
    if (suppressNavReport) return;
    window.parent.postMessage({ source: FRAME_SOURCE, kind: "nav", href: location.href, nav }, parentOrigin);
  };
  report("load");
  window.addEventListener("hashchange", () => report("pop"));
  window.addEventListener("popstate", () => report("pop"));
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) report("pop");
  });
  const wrapHistory = (method: "pushState" | "replaceState", nav: Nav): void => {
    const original = history[method];
    history[method] = function patchedHistory(this: History, ...args: Parameters<History["pushState"]>): void {
      original.apply(this, args);
      report(nav);
    };
  };
  wrapHistory("pushState", "push");
  wrapHistory("replaceState", "replace");

  /**
   * Soft SPA navigation for sibling frames on the same origin: switches routes inside
   * React Router / Next.js / Vue Router / TanStack Router / SvelteKit without triggering
   * a full iframe reload or resetting in-memory app state.
   */
  const applySpaNav = (href: string, replace: boolean): void => {
    let target: URL;
    try {
      target = new URL(href, location.href);
    } catch {
      return;
    }
    if (target.origin !== location.origin) {
      location.assign(target.href);
      return;
    }
    if (target.href === location.href) return;
    const prevHref = location.href;
    const prevHash = location.hash;
    const rel = `${target.pathname}${target.search}${target.hash}`;

    const isNext = "__NEXT_DATA__" in window || "__next_f" in window;
    if (isNext) {
      const links = document.querySelectorAll<HTMLAnchorElement>("a[href]");
      for (const link of links) {
        if (link.target && link.target !== "_self") continue;
        if (link.hasAttribute("download")) continue;
        if (link.href === target.href) {
          suppressNavReport = true;
          try {
            link.click();
          } finally {
            window.setTimeout(() => {
              suppressNavReport = false;
            }, 0);
          }
          return;
        }
      }
    }

    suppressNavReport = true;
    try {
      if (replace) history.replaceState(null, "", rel);
      else history.pushState(null, "", rel);
      window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
      if (target.hash !== prevHash) {
        window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: prevHref, newURL: target.href }));
      }
    } finally {
      suppressNavReport = false;
    }
  };

  // Navigator and User-Agent data.

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

  // Hide desktop scrollbars inside the simulated phone (scrolling via wheel and drag still works).
  const scrollbarSheet = new CSSStyleSheet();
  scrollbarSheet.replaceSync(
    `html, body, * { scrollbar-width: none !important; }
     html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`,
  );

  // Finger cursor and drag-to-scroll (constructable sheets are not subject to the site's CSP).

  const FINGER =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='13' fill='rgba(140,145,160,0.38)' stroke='rgba(255,255,255,0.92)' stroke-width='2'/%3E%3C/svg%3E\") 18 18, auto";
  const cursorSheet = new CSSStyleSheet();
  cursorSheet.replaceSync(
    `html, html * { cursor: ${FINGER} !important; }
     input, textarea, select, [contenteditable=""], [contenteditable="true"] { cursor: text !important; }`,
  );
  const draggingSheet = new CSSStyleSheet();
  draggingSheet.replaceSync("html, html * { user-select: none !important; -webkit-user-select: none !important; }");
  draggingSheet.disabled = true;
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, scrollbarSheet, cursorSheet, draggingSheet];

  let touchCursor = env.cursor;
  const setTouchCursor = (on: boolean): void => {
    touchCursor = on;
    cursorSheet.disabled = !on;
  };
  setTouchCursor(env.cursor);

  /** Targets that keep normal mouse behaviour: typing, media, canvases (maps, games), native drag. */
  const KEEP_MOUSE =
    'input, textarea, select, option, [contenteditable=""], [contenteditable="true"], video, audio, canvas, iframe, embed, object, [draggable="true"]';

  function canScroll(element: Element, vertical: boolean): boolean {
    const style = getComputedStyle(element);
    const overflow = vertical ? style.overflowY : style.overflowX;
    if (overflow !== "auto" && overflow !== "scroll" && overflow !== "overlay") return false;
    return vertical ? element.scrollHeight > element.clientHeight : element.scrollWidth > element.clientWidth;
  }

  function findScroller(start: Element, vertical: boolean): Element {
    for (let element: Element | null = start; element; element = element.parentElement) {
      if (element === document.body || element === document.documentElement) break;
      if (canScroll(element, vertical)) return element;
    }
    return document.scrollingElement ?? document.documentElement;
  }

  interface Drag {
    pointerId: number;
    target: Element;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    velocityX: number;
    velocityY: number;
    scroller: Element | null;
  }

  let drag: Drag | null = null;
  let momentumFrame = 0;

  const stopMomentum = (): void => {
    cancelAnimationFrame(momentumFrame);
    momentumFrame = 0;
  };

  function glide(scroller: Element, velocityX: number, velocityY: number): void {
    let vx = velocityX;
    let vy = velocityY;
    const step = (): void => {
      vx *= 0.94;
      vy *= 0.94;
      if (Math.abs(vx) < 0.4 && Math.abs(vy) < 0.4) {
        momentumFrame = 0;
        return;
      }
      scroller.scrollBy({ left: -vx, top: -vy, behavior: "instant" });
      momentumFrame = requestAnimationFrame(step);
    };
    momentumFrame = requestAnimationFrame(step);
  }

  /** After a drag, the click that follows the mouseup must not activate a link. */
  function swallowNextClick(): void {
    const swallow = (event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
  }

  // Bubble phase on window: the site's own handlers run first and can opt out with preventDefault().
  window.addEventListener("pointerdown", (event) => {
    stopMomentum();
    if (!touchCursor || event.pointerType !== "mouse" || event.button !== 0 || event.defaultPrevented) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest(KEEP_MOUSE)) return;
    drag = {
      pointerId: event.pointerId,
      target,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocityX: 0,
      velocityY: 0,
      scroller: null,
    };
  });

  window.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    if (!drag.scroller) {
      const totalX = event.clientX - drag.startX;
      const totalY = event.clientY - drag.startY;
      if (Math.hypot(totalX, totalY) < 6) return;
      drag.scroller = findScroller(drag.target, Math.abs(totalY) >= Math.abs(totalX));
      draggingSheet.disabled = false;
      window.getSelection()?.removeAllRanges();
    }
    drag.scroller.scrollBy({ left: -dx, top: -dy, behavior: "instant" });
    const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
    drag.velocityX = (dx / elapsed) * 16;
    drag.velocityY = (dy / elapsed) * 16;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;
  });

  const endDrag = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { scroller, velocityX, velocityY, lastTime } = drag;
    drag = null;
    draggingSheet.disabled = true;
    if (!scroller) return;
    if (event.type === "pointerup") swallowNextClick();
    // Only glide when the pointer was still moving at release.
    if (event.timeStamp - lastTime < 80) glide(scroller, velocityX, velocityY);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  // Links and images would start a native drag (and cancel the pointer stream) while scrolling.
  window.addEventListener(
    "dragstart",
    (event) => {
      if (drag) event.preventDefault();
    },
    true,
  );

  // Auto-focus: let the simulator know which device the user clicked or wheeled inside.
  let lastFocusPing = 0;
  const pingFocus = (): void => {
    const now = performance.now();
    if (now - lastFocusPing < 180) return;
    lastFocusPing = now;
    window.parent.postMessage({ source: FRAME_SOURCE, kind: "focus" }, parentOrigin);
  };
  window.addEventListener("pointerdown", pingFocus, { capture: true, passive: true });
  window.addEventListener("wheel", pingFocus, { capture: true, passive: true });

  // Synchronised scrolling across sibling devices (60fps smooth lerp on receiver, loop-safe).

  let syncScroll = env.syncScroll;
  let suppressSyncUntil = 0;
  let scrollFrame = 0;
  let syncLerpFrame = 0;
  let syncTarget: { ratioX: number; ratioY: number } | null = null;

  const clampRatio = (value: number): number => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

  const stopSyncLerp = (): void => {
    if (syncLerpFrame) cancelAnimationFrame(syncLerpFrame);
    syncLerpFrame = 0;
    syncTarget = null;
  };

  const runSyncLerp = (): void => {
    syncLerpFrame = 0;
    if (!syncTarget || !syncScroll) return;
    const scroller = document.scrollingElement ?? document.documentElement;
    const maxX = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const maxY = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const targetX = syncTarget.ratioX * maxX;
    const targetY = syncTarget.ratioY * maxY;
    const dx = targetX - scroller.scrollLeft;
    const dy = targetY - scroller.scrollTop;
    suppressSyncUntil = performance.now() + 140;
    if (Math.abs(dx) < 0.75 && Math.abs(dy) < 0.75) {
      scroller.scrollTo({ left: targetX, top: targetY, behavior: "instant" });
      syncTarget = null;
      return;
    }
    scroller.scrollTo({
      left: scroller.scrollLeft + dx * 0.45,
      top: scroller.scrollTop + dy * 0.45,
      behavior: "instant",
    });
    syncLerpFrame = requestAnimationFrame(runSyncLerp);
  };

  const scheduleSyncScroll = (ratioX: number, ratioY: number): void => {
    stopMomentum();
    syncTarget = { ratioX: clampRatio(ratioX), ratioY: clampRatio(ratioY) };
    if (!syncLerpFrame) syncLerpFrame = requestAnimationFrame(runSyncLerp);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!syncScroll || performance.now() < suppressSyncUntil || scrollFrame !== 0) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        if (!syncScroll || performance.now() < suppressSyncUntil) return;
        const scroller = document.scrollingElement ?? document.documentElement;
        const maxX = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
        const maxY = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const ratioX = maxX > 0 ? clampRatio(scroller.scrollLeft / maxX) : 0;
        const ratioY = maxY > 0 ? clampRatio(scroller.scrollTop / maxY) : 0;
        window.parent.postMessage({ source: FRAME_SOURCE, kind: "scroll", ratioX, ratioY }, parentOrigin);
      });
    },
    { passive: true },
  );

  // Auto-scroll recording engine: silky sub-pixel delta-time scrolling with hero pause & auto-stop at bottom.

  let autoScrollFrame = 0;
  let autoScrollTimer = 0;
  let cursorBeforeAuto: boolean | null = null;

  const stopAutoScroll = (): void => {
    if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    if (autoScrollTimer) clearTimeout(autoScrollTimer);
    autoScrollFrame = 0;
    autoScrollTimer = 0;
    if (cursorBeforeAuto !== null) {
      setTouchCursor(cursorBeforeAuto);
      cursorBeforeAuto = null;
    }
  };

  const startAutoScroll = (speed: number, fromTop: boolean, delayMs: number, stopAtBottom: boolean): void => {
    stopAutoScroll();
    stopMomentum();
    stopSyncLerp();
    const safeSpeed = Math.min(500, Math.max(30, Number.isFinite(speed) ? speed : 120));
    const safeDelay = Math.min(5000, Math.max(0, Number.isFinite(delayMs) ? delayMs : 1000));
    cursorBeforeAuto = touchCursor;
    setTouchCursor(false);

    const scroller = document.scrollingElement ?? document.documentElement;
    if (fromTop) scroller.scrollTo({ top: 0, left: 0, behavior: "instant" });

    autoScrollTimer = window.setTimeout(() => {
      autoScrollTimer = 0;
      let lastTime = performance.now();
      let carry = 0;
      let stalledFrames = 0;

      const tick = (now: number): void => {
        const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
        lastTime = now;
        const activeScroller = document.scrollingElement ?? document.documentElement;
        const maxY = Math.max(0, activeScroller.scrollHeight - activeScroller.clientHeight);
        carry += safeSpeed * dt;
        const step = Math.floor(carry);
        if (step >= 1) {
          carry -= step;
          const before = activeScroller.scrollTop;
          activeScroller.scrollBy({ top: step, behavior: "instant" });
          const after = activeScroller.scrollTop;
          if (Math.abs(after - before) < 0.5) stalledFrames += 1;
          else stalledFrames = 0;
        }
        const atBottom = maxY <= 1 || activeScroller.scrollTop >= maxY - 1.5 || stalledFrames >= 6;
        if (atBottom) {
          autoScrollFrame = 0;
          if (stopAtBottom) {
            autoScrollTimer = window.setTimeout(() => {
              stopAutoScroll();
              window.parent.postMessage({ source: FRAME_SOURCE, kind: "auto-scroll-done" }, parentOrigin);
            }, 800);
          } else {
            stopAutoScroll();
          }
          return;
        }
        autoScrollFrame = requestAnimationFrame(tick);
      };
      autoScrollFrame = requestAnimationFrame(tick);
    }, safeDelay);
  };

  // Commands from the simulator: only from the verified parent, only known shapes.

  window.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.origin !== parentOrigin || event.source !== window.parent) return;
    const data = event.data;
    if (typeof data !== "object" || data === null) return;
    const msg = data as Record<string, unknown>;
    if (msg.source !== PARENT_SOURCE) return;
    if (msg.cmd === "back") history.back();
    else if (msg.cmd === "forward") history.forward();
    else if (msg.cmd === "config") {
      if (typeof msg.touchCursor === "boolean") {
        if (cursorBeforeAuto !== null) cursorBeforeAuto = msg.touchCursor;
        else setTouchCursor(msg.touchCursor);
      }
      if (typeof msg.syncScroll === "boolean") {
        syncScroll = msg.syncScroll;
        if (!syncScroll) stopSyncLerp();
      }
    } else if (msg.cmd === "scroll" && typeof msg.ratioX === "number" && typeof msg.ratioY === "number") {
      if (syncScroll) scheduleSyncScroll(msg.ratioX, msg.ratioY);
    } else if (msg.cmd === "spa-nav" && typeof msg.href === "string") {
      applySpaNav(msg.href, msg.replace === true);
    } else if (
      msg.cmd === "auto-scroll-start" &&
      typeof msg.speed === "number" &&
      typeof msg.fromTop === "boolean" &&
      typeof msg.delayMs === "number" &&
      typeof msg.stopAtBottom === "boolean"
    ) {
      startAutoScroll(msg.speed, msg.fromTop, msg.delayMs, msg.stopAtBottom);
    } else if (msg.cmd === "auto-scroll-stop") {
      stopAutoScroll();
    }
  });

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
