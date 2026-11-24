import {
  customBackgroundSchema,
  MAX_CUSTOM_BACKGROUNDS,
  MAX_CUSTOM_BG_DATA_URL_LENGTH,
  type CustomBackground,
} from "@/schemas/customBackground";

const STORAGE_KEY = "customBackgrounds";
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

/** Valid custom backgrounds from local storage; invalid or duplicate entries are dropped one by one. */
export function parseCustomBackgrounds(raw: unknown): CustomBackground[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: CustomBackground[] = [];
  for (const item of raw) {
    const parsed = customBackgroundSchema.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    result.push(parsed.data);
    if (result.length >= MAX_CUSTOM_BACKGROUNDS) break;
  }
  return result;
}

export async function loadCustomBackgrounds(): Promise<CustomBackground[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return parseCustomBackgrounds(stored[STORAGE_KEY]);
}

export async function saveCustomBackgrounds(list: readonly CustomBackground[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: parseCustomBackgrounds(list) });
}

export function onCustomBackgroundsChanged(listener: (list: CustomBackground[]) => void): () => void {
  const handle = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    const change = changes[STORAGE_KEY];
    if (area === "local" && change) listener(parseCustomBackgrounds(change.newValue));
  };
  chrome.storage.onChanged.addListener(handle);
  return () => chrome.storage.onChanged.removeListener(handle);
}

function cleanLabel(fileName: string): string {
  const stripped = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (stripped || "Custom photo").slice(0, 40);
}

function loadFileImage(file: File): Promise<{ width: number; height: number; draw(ctx: CanvasRenderingContext2D, w: number, h: number): void; cleanup(): void }> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).then((bitmap) => ({
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close(),
    }));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
        cleanup: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
}

/**
 * Decodes and compresses a user-picked image 100% locally in the browser (zero server upload)
 * into a lightweight HD WebP data URL suitable for chrome.storage.local.
 */
export async function compressWallpaperFile(file: File): Promise<CustomBackground> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG, WebP, or GIF).");
  }
  const source = await loadFileImage(file);
  try {
    const scale = Math.min(1, MAX_WIDTH / Math.max(1, source.width), MAX_HEIGHT / Math.max(1, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    source.draw(ctx, width, height);

    let dataUrl = canvas.toDataURL("image/webp", 0.86);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    }
    if (dataUrl.length > MAX_CUSTOM_BG_DATA_URL_LENGTH) {
      dataUrl = canvas.toDataURL("image/webp", 0.68);
    }
    if (dataUrl.length > MAX_CUSTOM_BG_DATA_URL_LENGTH) {
      throw new Error("That image is still too large after compression. Try a smaller photo.");
    }

    const id = `custom-bg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    return customBackgroundSchema.parse({ id, name: cleanLabel(file.name), dataUrl });
  } finally {
    source.cleanup();
  }
}
