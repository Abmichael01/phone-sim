export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
 * Captures the visible tab (extension pages may call captureVisibleTab
 * directly) and crops it to `element`. The image-to-CSS ratio is measured from
 * the capture itself, which equals devicePixelRatio and also survives page zoom.
 */
export async function captureElementPng(element: HTMLElement): Promise<Blob> {
  const bounds = element.getBoundingClientRect();
  const crop = cropToViewport(
    { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
    { width: window.innerWidth, height: window.innerHeight },
  );
  if (!crop) throw new Error("The device is not visible on screen.");

  const image = await loadImage(await chrome.tabs.captureVisibleTab({ format: "png" }));
  const ratio = image.naturalWidth / window.innerWidth;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(crop.width * ratio);
  canvas.height = Math.round(crop.height * ratio);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available.");
  context.drawImage(image, crop.x * ratio, crop.y * ratio, crop.width * ratio, crop.height * ratio, 0, 0, canvas.width, canvas.height);
  return canvasToPng(canvas);
}
