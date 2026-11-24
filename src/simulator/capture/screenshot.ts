import type { CaptureQuality } from "@/schemas/settings";
import { targetCaptureDimensions } from "./quality";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureOptions {
  /** Optional corner radius in CSS px: masks the four rounded corners to transparent alpha. */
  cornerRadiusCss?: number;
  /** Optional outer padding in CSS px to include surrounding stage background around the element. */
  padCss?: number;
  /** Optional container bounds to clamp padded capture (e.g. stage canvas so left rail is never included). */
  clampTo?: HTMLElement | null;
  /** Output resolution preset (720p, 1080p default, 2K, or exact native pixels). */
  quality?: CaptureQuality;
}

/** Part of `rect` that is inside the visible viewport (a zoomed frame can overflow it). */
export function cropToViewport(rect: CropRect, viewport: { width: number; height: number }): CropRect | null {
  const left = Math.max(0, rect.x);
  const top = Math.max(0, rect.y);
  const right = Math.min(viewport.width, rect.x + rect.width);
  const bottom = Math.min(viewport.height, rect.y + rect.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function clampRect(rect: CropRect, container: CropRect): CropRect | null {
  const left = Math.max(container.x, rect.x);
  const top = Math.max(container.y, rect.y);
  const right = Math.min(container.x + container.width, rect.x + rect.width);
  const bottom = Math.min(container.y + container.height, rect.y + rect.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The captured image could not be read."));
    image.src = source;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The screenshot could not be encoded."))), "image/png");
  });
}

/**
 * Captures the visible tab at full physical DPI and crops it to `element`,
 * then outputs at the selected quality preset (720p / 1080p / 2K / Native).
 * Supports optional studio background padding clamped inside the stage,
 * or rounded transparent PNG corners.
 */
export async function captureElementPng(element: HTMLElement, options: CaptureOptions = {}): Promise<Blob> {
  const bounds = element.getBoundingClientRect();
  const pad = Math.max(0, options.padCss ?? 0);
  const expanded: CropRect = {
    x: bounds.left - pad,
    y: bounds.top - pad,
    width: bounds.width + pad * 2,
    height: bounds.height + pad * 2,
  };
  const clampBounds = options.clampTo?.getBoundingClientRect();
  const bounded = clampBounds
    ? clampRect(expanded, { x: clampBounds.left, y: clampBounds.top, width: clampBounds.width, height: clampBounds.height })
    : expanded;
  const crop = bounded ? cropToViewport(bounded, { width: window.innerWidth, height: window.innerHeight }) : null;
  if (!crop) throw new Error("The device is not visible on screen.");

  const image = await loadImage(await chrome.tabs.captureVisibleTab({ format: "png" }));
  const ratio = image.naturalWidth / window.innerWidth;
  const srcW = crop.width * ratio;
  const srcH = crop.height * ratio;
  const out = targetCaptureDimensions(srcW, srcH, options.quality ?? "1080p", false);
  const outScale = out.width / Math.max(1, srcW);

  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const fullyVisible =
    pad === 0 && Math.abs(crop.width - bounds.width) < 1 && Math.abs(crop.height - bounds.height) < 1;
  const radius =
    options.cornerRadiusCss && fullyVisible
      ? Math.min(options.cornerRadiusCss * ratio * outScale, canvas.width / 2, canvas.height / 2)
      : 0;
  if (radius > 0) {
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, radius);
    context.clip();
  }

  context.drawImage(image, crop.x * ratio, crop.y * ratio, srcW, srcH, 0, 0, canvas.width, canvas.height);
  return canvasToPng(canvas);
}
