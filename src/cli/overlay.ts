import type { Issue } from "./issues";
import type { RawRect, Severity } from "./rules";

/** Numbered boxes drawn over the page before the annotated screenshot. */

export const SEVERITY_COLORS: Record<Severity, string> = {
  error: "#e5484d",
  warn: "#f5a524",
  info: "#3b82f6",
};

export const BADGE_SIZE = 18;

export interface OverlayBox {
  rect: RawRect;
  color: string;
}

export interface OverlayBadge {
  number: number;
  x: number;
  y: number;
  color: string;
}

export interface Overlay {
  boxes: OverlayBox[];
  badges: OverlayBadge[];
}

export interface ScreenShape {
  /** Viewport width in CSS px; boxes are clamped to it so they never widen the page. */
  width: number;
  /** Rounded screen corners (0 without a frame): badges are kept out of them. */
  cornerRadius: number;
  /** Camera cutouts in viewport coordinates: badges are moved off them. */
  avoid: readonly RawRect[];
}

function overlaps(a: RawRect, b: RawRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Smallest x at height `y` that is inside a rounded top corner of radius `r`. */
function cornerInset(y: number, r: number): number {
  if (r <= 0 || y >= r) return 0;
  return r - Math.sqrt(r * r - (r - y) * (r - y));
}

/** Places a badge at the top-left of its box, then nudges it out of corners, cutouts and other badges. */
function placeBadge(rect: RawRect, shape: ScreenShape, taken: RawRect[]): { x: number; y: number } {
  const size = BADGE_SIZE;
  let x = rect.x - 6;
  let y = Math.max(0, rect.y - size / 2);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const inset = Math.max(cornerInset(y, shape.cornerRadius), cornerInset(y + size, shape.cornerRadius));
    x = Math.min(Math.max(x, inset + 2, 0), shape.width - size - inset - 2);
    const badge = { x, y, width: size, height: size };
    const cutout = shape.avoid.find((area) => overlaps(badge, { x: area.x - 2, y: area.y - 2, width: area.width + 4, height: area.height + 4 }));
    if (cutout) {
      if (cutout.width >= cutout.height) y = cutout.y + cutout.height + 4;
      else x = cutout.x + cutout.width + 4;
      continue;
    }
    const clash = taken.find((other) => overlaps(badge, other));
    if (!clash) return { x, y };
    x = clash.x + size + 3;
    if (x > shape.width - size - 2) {
      x = rect.x;
      y = clash.y + size + 3;
    }
  }
  return { x, y };
}

/** Boxes and numbered badges for every issue with a position, numbered like the report. */
export function layoutOverlay(issues: readonly Issue[], shape: ScreenShape): Overlay {
  const boxes: OverlayBox[] = [];
  const badges: OverlayBadge[] = [];
  const taken: RawRect[] = [];
  for (const issue of issues) {
    const color = SEVERITY_COLORS[issue.severity];
    issue.rects.forEach((rect, index) => {
      const left = Math.max(0, rect.x);
      const right = Math.min(shape.width, rect.x + rect.width);
      const width = Math.max(4, right - left);
      const clamped = { x: Math.min(left, shape.width - width), y: rect.y, width, height: Math.max(4, rect.height) };
      boxes.push({ rect: clamped, color });
      if (index > 0) return;
      const spot = placeBadge(clamped, shape, taken);
      taken.push({ ...spot, width: BADGE_SIZE, height: BADGE_SIZE });
      badges.push({ number: issue.number, color, ...spot });
    });
  }
  return { boxes, badges };
}

const px = (value: number) => `${Math.round(value * 100) / 100}px`;

/**
 * The overlay as HTML, positioned in screenshot (page) CSS px. It is drawn over
 * the screenshot when the framed image is rendered, so the checked page is
 * never touched and numbers can be aligned across devices afterwards.
 */
export function overlayHtml(overlay: Overlay): string {
  const boxes = overlay.boxes.map(
    (box) =>
      `<div style="position:absolute;box-sizing:border-box;left:${px(box.rect.x)};top:${px(box.rect.y)};width:${px(box.rect.width)};height:${px(box.rect.height)};border:2px solid ${box.color};border-radius:3px;background:${box.color}14"></div>`,
  );
  const badges = overlay.badges.map(
    (badge) =>
      `<div style="position:absolute;left:${px(badge.x)};top:${px(badge.y)};min-width:${BADGE_SIZE}px;height:${BADGE_SIZE}px;padding:0 4px;box-sizing:border-box;border-radius:${BADGE_SIZE / 2}px;background:${badge.color};color:#fff;font:700 11px/${BADGE_SIZE}px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 1.5px #fff">${Math.trunc(badge.number)}</div>`,
  );
  return `<div style="position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none">${boxes.join("")}${badges.join("")}</div>`;
}
