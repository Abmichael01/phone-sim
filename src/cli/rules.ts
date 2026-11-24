/**
 * The responsive rules, run inside the checked page with `page.evaluate`.
 *
 * `collectIssues` must stay SELF-CONTAINED: Playwright sends it to the page as
 * source text, so it may not use imports, module constants or anything else
 * defined outside its own body. Types are fine (they disappear at build time).
 */

export type Severity = "error" | "warn" | "info";

export type RuleId =
  | "viewport-meta"
  | "horizontal-overflow"
  | "small-tap-target"
  | "small-text"
  | "ios-input-zoom"
  | "text-clipped"
  | "fixed-covers-screen"
  | "safe-area"
  | "image-oversize";

/** CSS px in page (document) coordinates. */
export interface RawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RawIssue {
  rule: RuleId;
  severity: Severity;
  /** Short CSS selector for the element (with :nth-of-type where needed). */
  selector: string;
  /** Same selector without :nth-of-type, used to group look-alike elements. */
  groupKey: string;
  /** What is wrong, in plain words, with the numbers. */
  message: string;
  /** The element's text (first 40 characters) or other context, for searching the code. */
  detail: string;
  rect: RawRect | null;
  /** The rule's measurement (px over, font size, coverage %…), used to pick the worst of a group. */
  value: number;
}

export interface RuleOptions {
  /** iPhone or iPad Safari (input zoom applies). */
  ios: boolean;
  /** iPad: desktop-class Safari that requests desktop sites. */
  desktopClass: boolean;
  dpr: number;
  /** Portrait device with a notch, Dynamic Island or punch-hole camera. */
  checkSafeArea: boolean;
  /** Most overflow root causes to report. */
  maxOverflow: number;
}

export function collectIssues(options: RuleOptions): RawIssue[] {
  const issues: RawIssue[] = [];
  const body = document.body;
  const root = document.documentElement;
  if (!body) return issues;
  // The screen in CSS px. Not innerWidth: mobile Chromium widens the layout
  // viewport to the content when a page overflows, so innerWidth would hide it.
  const vw = root.clientWidth || window.innerWidth;
  const vh = root.clientHeight || window.innerHeight;
  const sx = window.scrollX;
  const sy = window.scrollY;

  const styles = new Map<Element, CSSStyleDeclaration>();
  function styleOf(el: Element): CSSStyleDeclaration {
    let style = styles.get(el);
    if (!style) {
      style = getComputedStyle(el);
      styles.set(el, style);
    }
    return style;
  }

  const rects = new Map<Element, DOMRect>();
  function rectOf(el: Element): DOMRect {
    let rect = rects.get(el);
    if (!rect) {
      rect = el.getBoundingClientRect();
      rects.set(el, rect);
    }
    return rect;
  }

  /** A clip that leaves (almost) nothing visible: the "sr-only" / "visually-hidden" pattern. */
  function clipsToNothing(el: Element): boolean {
    const style = styleOf(el);
    if (style.clip && style.clip.startsWith("rect(")) {
      const [top, right, bottom, left] = (style.clip.match(/-?[\d.]+/g) ?? []).map(Number);
      if (top !== undefined && right !== undefined && bottom !== undefined && left !== undefined) {
        if (right - left <= 2 || bottom - top <= 2) return true;
      }
    }
    if (/inset\(\s*(50|100)%/.test(style.clipPath)) return true;
    if (style.overflowX !== "visible" || style.overflowY !== "visible") {
      const rect = rectOf(el);
      if (rect.width <= 2 || rect.height <= 2) return true;
    }
    return false;
  }

  const hiddenTrees = new Map<Element, boolean>();
  /** Inside a screen-reader-only ancestor. */
  function insideHidden(el: Element): boolean {
    const parent = el.parentElement;
    if (!parent || parent === body || parent === root) return false;
    const cached = hiddenTrees.get(parent);
    if (cached !== undefined) return cached;
    const hidden = clipsToNothing(parent) || insideHidden(parent);
    hiddenTrees.set(parent, hidden);
    return hidden;
  }

  /** Visually hidden on purpose (screen-reader-only text, skip links before focus). */
  function visuallyHidden(el: Element, rect: DOMRect): boolean {
    return rect.width <= 2 || rect.height <= 2 || clipsToNothing(el) || insideHidden(el);
  }

  function isVisible(el: Element, rect: DOMRect): boolean {
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (typeof el.checkVisibility === "function") {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    } else {
      const style = styleOf(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    }
    return !visuallyHidden(el, rect);
  }

  function toRect(rect: DOMRect): RawRect {
    return {
      x: Math.round(rect.left + sx),
      y: Math.round(rect.top + sy),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }

  function looksGenerated(name: string): boolean {
    return name.startsWith("css-") || name.startsWith("sc-") || (/\d/.test(name) && name.length > 12);
  }

  function uniqueId(el: Element): string | null {
    if (!el.id || looksGenerated(el.id)) return null;
    const selector = `#${CSS.escape(el.id)}`;
    return document.querySelectorAll(selector).length === 1 ? selector : null;
  }

  function part(el: Element, withNth: boolean): string {
    const tag = el.tagName.toLowerCase();
    const classes = Array.from(el.classList)
      .filter((name) => !looksGenerated(name))
      .slice(0, 2)
      .map((name) => `.${CSS.escape(name)}`)
      .join("");
    let text = tag + classes;
    const parent = el.parentElement;
    if (withNth && parent) {
      const same = Array.from(parent.children).filter((child) => child.tagName === el.tagName);
      if (same.length > 1) text += `:nth-of-type(${same.indexOf(el) + 1})`;
    }
    return text;
  }

  function selectorOf(el: Element, withNth: boolean): string {
    const own = uniqueId(el);
    if (own) return own;
    const parts: string[] = [];
    let current: Element | null = el;
    while (current && current !== root && parts.length < 3) {
      const id = parts.length > 0 ? uniqueId(current) : null;
      if (id) {
        parts.unshift(id);
        break;
      }
      parts.unshift(part(current, withNth));
      if (current === body) break;
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  /** Tag plus up to 2 stable classes: no ids, no positions. */
  function shapeOf(el: Element): string {
    return part(el, false);
  }

  /** Group key: the element's shape and its parent's, so every footnote link or nav item groups together. */
  function groupKeyOf(el: Element): string {
    const parent = el.parentElement;
    return parent && parent !== root ? `${shapeOf(parent)} > ${shapeOf(el)}` : shapeOf(el);
  }

  function textOf(el: Element): string {
    const label =
      el.getAttribute("aria-label") ||
      el.textContent ||
      el.getAttribute("alt") ||
      el.getAttribute("placeholder") ||
      el.getAttribute("title") ||
      el.getAttribute("name") ||
      "";
    const clean = label.replace(/\s+/g, " ").trim();
    return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
  }

  function hasOwnText(el: Element): boolean {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== "") return true;
    }
    return false;
  }

  function push(
    el: Element | null,
    rule: RuleId,
    severity: Severity,
    message: string,
    value: number,
    rect: DOMRect | null,
    detail?: string,
  ): void {
    issues.push({
      rule,
      severity,
      selector: el ? selectorOf(el, true) : "html",
      groupKey: el ? groupKeyOf(el) : "html",
      message,
      detail: detail ?? (el ? textOf(el) : ""),
      rect: rect ? toRect(rect) : null,
      value,
    });
  }

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD", "META", "LINK", "TITLE", "BR", "WBR"]);
  const all = Array.from(body.querySelectorAll("*")).filter(
    (el) => !SKIP_TAGS.has(el.tagName) && !(el instanceof SVGElement && el.tagName.toLowerCase() !== "svg"),
  );
  // 1. viewport-meta
  const viewportContent = Array.from(document.querySelectorAll('meta[name="viewport" i]'))
    .map((meta) => meta.getAttribute("content") ?? "")
    .join(",")
    .toLowerCase()
    .replace(/\s+/g, "");
  if (!/(^|,)width=device-width/.test(viewportContent)) {
    const missing = viewportContent
      ? `the viewport meta tag does not set width=device-width ("${viewportContent}")`
      : 'no <meta name="viewport"> tag';
    // iPad Safari asks for desktop sites and zooms them to fit: worth knowing, not broken.
    const message = options.desktopClass
      ? `${missing}: iPad Safari shows the page as a zoomed-out desktop site`
      : `${missing}: phones show the page zoomed out${viewportContent ? "" : " at 980px wide"}`;
    push(null, "viewport-meta", options.desktopClass ? "info" : "error", message, 1, null, "<head>");
  }
  const viewportFitCover = /viewport-fit=cover/.test(viewportContent);

  // 2. horizontal-overflow: find the elements that widen the page, not their children.
  const pageWidth = Math.max(root.scrollWidth, body.scrollWidth);
  if (pageWidth > vw + 1) {
    const clips = new Map<Element, boolean>();
    const clippedByAncestor = (el: Element): boolean => {
      const parent = el.parentElement;
      if (!parent || parent === body || parent === root) return false;
      const cached = clips.get(parent);
      if (cached !== undefined) return cached;
      const overflowX = styleOf(parent).overflowX;
      const clipped = overflowX !== "visible" || clippedByAncestor(parent);
      clips.set(parent, clipped);
      return clipped;
    };
    const overBy = (rect: DOMRect): { right: number; left: number } => ({
      right: rect.right - vw,
      left: -rect.left,
    });
    const found: { el: Element; rect: DOMRect; amount: number; side: "right" | "left" }[] = [];
    for (const el of all) {
      const rect = rectOf(el);
      if (rect.width <= 0) continue;
      const over = overBy(rect);
      const right = over.right > 1;
      // A box cut off on the left is broken; one fully off-screen to the left is an intentional off-canvas panel.
      const left = over.left > 1 && rect.right > 0;
      if (!right && !left) continue;
      if (styleOf(el).position === "fixed") continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      if (clippedByAncestor(el) || visuallyHidden(el, rect)) continue;
      const side = right ? "right" : "left";
      const amount = right ? over.right : over.left;
      let parent = el.parentElement;
      while (parent && parent !== body && parent !== root && rectOf(parent).width === 0) parent = parent.parentElement;
      if (parent && parent !== body && parent !== root) {
        const parentOver = overBy(rectOf(parent));
        if ((side === "right" ? parentOver.right : parentOver.left) >= amount - 1) continue;
      }
      found.push({ el, rect, amount, side });
    }
    found.sort((a, b) => b.amount - a.amount);
    const extra = Math.round(pageWidth - vw);
    for (const item of found.slice(0, Math.max(1, options.maxOverflow))) {
      const px = Math.round(item.amount);
      const where = item.side === "right" ? "sticks out" : "is cut off";
      push(
        item.el,
        "horizontal-overflow",
        "error",
        `${where} ${px}px past the ${item.side} edge (element is ${Math.round(item.rect.width)}px wide, screen is ${vw}px)`,
        px,
        item.rect,
        `${textOf(item.el) || "(no text)"} | page is ${extra}px wider than the screen`,
      );
    }
    if (found.length === 0) {
      push(null, "horizontal-overflow", "error", `the page is ${extra}px wider than the screen and scrolls sideways`, extra, null, "(cause not found)");
    }
  }

  // 3. small-tap-target
  const TAP =
    'a[href], button, input:not([type="hidden" i]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="tab"], [role="menuitem"], [onclick], [tabindex]:not([tabindex="-1"])';
  const textLength = (node: Node): number => (node.textContent ?? "").replace(/\s+/g, " ").trim().length;
  const proseLengths = new Map<Element, number>();
  /** Text in a block that is not part of a link or button: long for a sentence, near zero for a nav. */
  const proseLength = (block: Element): number => {
    let length = proseLengths.get(block);
    if (length === undefined) {
      const controls = Array.from(block.querySelectorAll("a, button")).filter((control) => !control.parentElement?.closest("a, button"));
      length = Math.max(0, textLength(block) - controls.reduce((sum, control) => sum + textLength(control), 0));
      proseLengths.set(block, length);
    }
    return length;
  };
  /**
   * WCAG 2.5.8 inline exception: a link inside a sentence (also through inline
   * wrappers such as <sup>, <em>, <span>) cannot be made bigger without
   * breaking the text, so it is not a tap-target problem.
   */
  const inRunningText = (el: Element): boolean => {
    if (styleOf(el).display !== "inline") return false;
    let block = el.parentElement;
    while (block && block !== body && styleOf(block).display === "inline") block = block.parentElement;
    if (!block) return false;
    // Footnote marks ([1] in <sup>) belong to whatever they annotate, even a short "0201[10]".
    if (el.closest("sup, sub")) return textLength(block) > textLength(el);
    // A sentence or a citation has real words around its links; a nav or pager only has separators.
    return proseLength(block) >= 20;
  };
  const targets: { el: Element; rect: DOMRect }[] = [];
  const undersized: { el: Element; rect: DOMRect; cx: number; cy: number }[] = [];
  const appleHint = (el: Element, rect: DOMRect) => {
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 44 || height < 44) {
      push(el, "small-tap-target", "info", `is ${width}×${height}px; Apple recommends at least 44×44px`, Math.min(width, height), rect);
    }
  };
  for (const el of Array.from(body.querySelectorAll(TAP))) {
    if (el.parentElement?.closest(TAP)) continue; // the outer control is the tap area
    const rect = rectOf(el);
    if (!isVisible(el, rect)) continue;
    targets.push({ el, rect });
    if (el.tagName === "A" && inRunningText(el)) continue;
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      const labelled = Array.from(el.labels ?? []).some((label) => (label.textContent ?? "").trim() !== "");
      if (labelled) continue; // its label is part of the target
    }
    if (rect.width < 24 || rect.height < 24) {
      undersized.push({ el, rect, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 });
    } else {
      appleHint(el, rect);
    }
  }
  // WCAG 2.5.8 spacing exception: an undersized target is fine when a 24px circle
  // centred on it touches no other target and no other undersized target's circle.
  const distanceToRect = (x: number, y: number, rect: DOMRect): number => {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    return Math.hypot(dx, dy);
  };
  for (const small of undersized) {
    const crowded =
      targets.some((other) => other.el !== small.el && distanceToRect(small.cx, small.cy, other.rect) < 12) ||
      undersized.some((other) => other.el !== small.el && Math.hypot(other.cx - small.cx, other.cy - small.cy) < 24);
    if (!crowded) {
      appleHint(small.el, small.rect);
      continue;
    }
    const width = Math.round(small.rect.width);
    const height = Math.round(small.rect.height);
    push(
      small.el,
      "small-tap-target",
      "warn",
      `is ${width}×${height}px with another target within 24px; a finger needs 24×24px`,
      Math.min(width, height),
      small.rect,
    );
  }

  // 4. small-text
  for (const el of all) {
    if (!hasOwnText(el) || el.closest("sup, sub")) continue; // footnote marks are small on purpose
    const size = Number.parseFloat(styleOf(el).fontSize);
    if (!(size < 11.95)) continue; // 11.97px (0.855em of 14px) is 12px for every reader
    const rect = rectOf(el);
    if (!isVisible(el, rect)) continue;
    push(el, "small-text", "warn", `text is ${Math.round(size * 10) / 10}px, below the 12px minimum`, size, rect);
  }

  // 5. ios-input-zoom
  if (options.ios) {
    const NO_ZOOM = new Set(["checkbox", "radio", "range", "color", "file", "submit", "button", "image", "reset", "hidden"]);
    for (const el of Array.from(body.querySelectorAll("input, select, textarea"))) {
      if (el instanceof HTMLInputElement && NO_ZOOM.has(el.type)) continue;
      const rect = rectOf(el);
      if (!isVisible(el, rect)) continue;
      const size = Number.parseFloat(styleOf(el).fontSize);
      if (!(size < 16)) continue;
      push(
        el,
        "ios-input-zoom",
        "warn",
        `font-size is ${Math.round(size * 10) / 10}px: iPhone Safari zooms the page in when it is tapped (needs 16px)`,
        size,
        rect,
      );
    }
  }

  // 6. text-clipped
  const FORM = new Set(["INPUT", "SELECT", "TEXTAREA"]);
  for (const el of all) {
    if (FORM.has(el.tagName) || !hasOwnText(el)) continue;
    const style = styleOf(el);
    if (style.overflowX !== "hidden" && style.overflowX !== "clip") continue;
    if (style.textOverflow === "ellipsis") continue;
    const hidden = el.scrollWidth - el.clientWidth;
    if (el.clientWidth <= 0 || hidden <= 1) continue;
    const rect = rectOf(el);
    if (!isVisible(el, rect)) continue;
    push(el, "text-clipped", "warn", `text is cut off: ${hidden}px of it is hidden`, hidden, rect);
  }

  // 7. fixed-covers-screen and 8. safe-area (fixed and sticky elements)
  const covering: Element[] = [];
  const edged: Element[] = [];
  const screenArea = vw * vh;
  for (const el of all) {
    const style = styleOf(el);
    if (style.position !== "fixed" && style.position !== "sticky") continue;
    const rect = rectOf(el);
    if (!isVisible(el, rect)) continue;
    if (!covering.some((outer) => outer.contains(el))) {
      const behind = Number.parseInt(style.zIndex, 10) < 0 || style.pointerEvents === "none";
      const ix = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
      const iy = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const share = screenArea > 0 ? (ix * iy) / screenArea : 0;
      if (!behind && share > 0.3) {
        covering.push(el);
        const pct = Math.round(share * 100);
        push(el, "fixed-covers-screen", "warn", `${style.position} element covers ${pct}% of the screen before the user scrolls`, pct, rect);
      }
    }
    if (options.checkSafeArea && viewportFitCover && rect.height >= 8 && !edged.some((outer) => outer.contains(el))) {
      const padTop = Number.parseFloat(style.paddingTop) || 0;
      const padBottom = Number.parseFloat(style.paddingBottom) || 0;
      let flagged = false;
      if (rect.top <= 0 && rect.bottom > 0 && padTop < 20) {
        push(el, "safe-area", "warn", `touches the top edge with ${Math.round(padTop)}px padding: the camera cutout covers it`, padTop, rect);
        flagged = true;
      }
      if (rect.bottom >= vh - 0.5 && rect.top < vh && padBottom < 16) {
        push(el, "safe-area", "warn", `touches the bottom edge with ${Math.round(padBottom)}px padding: the home bar covers it`, padBottom, rect);
        flagged = true;
      }
      if (flagged) edged.push(el);
    }
  }

  // 9. image-oversize
  for (const img of Array.from(body.querySelectorAll("img"))) {
    if (!img.complete || img.naturalWidth === 0) continue;
    const source = img.currentSrc || img.src;
    if (/\.svg(\?|#|$)/i.test(source) || source.startsWith("data:image/svg")) continue;
    const rect = rectOf(img);
    if (!isVisible(img, rect)) continue;
    const needed = rect.width * options.dpr;
    if (img.naturalWidth <= 2.5 * needed) continue;
    const ratio = Math.round((img.naturalWidth / needed) * 10) / 10;
    push(
      img,
      "image-oversize",
      "info",
      `is ${img.naturalWidth}px wide but shown at ${Math.round(rect.width)}px (${Math.round(needed)}px needed at ${options.dpr}x): ${ratio}× too big`,
      ratio,
      rect,
      source.startsWith("data:") ? "(inline data image)" : source.slice(0, 120),
    );
  }

  return issues;
}

/** Whether the page asked to draw under the notch (`viewport-fit=cover`). Self-contained, runs in the page. */
export function hasViewportFitCover(): boolean {
  return Array.from(document.querySelectorAll('meta[name="viewport" i]')).some((meta) =>
    /viewport-fit\s*=\s*cover/i.test(meta.getAttribute("content") ?? ""),
  );
}
