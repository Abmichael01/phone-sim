import type { Device } from "@/schemas/device";

/** Neutral per-brand tints (no logos): a small coloured device glyph tells brands apart. */
const BRAND_TINT: Record<string, string> = {
  Apple: "#b8bcc6",
  Samsung: "#5b8cff",
  Google: "#3ecf8e",
  Xiaomi: "#ff8a3d",
  OnePlus: "#ff5a5f",
  Motorola: "#5ec8f2",
  Huawei: "#e8576b",
  Nothing: "#e6e6e6",
  Custom: "#c084fc",
};

export function brandTint(brand: string): string {
  const known = BRAND_TINT[brand];
  if (known) return known;
  let hash = 0;
  for (const char of brand) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 65% 65%)`;
}

/** Small rounded phone / tablet / foldable outline tinted by brand. */
export function DeviceGlyph({ device, size = 16 }: { device: Device; size?: number }) {
  const tint = brandTint(device.brand);
  const tablet = device.kind === "tablet";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {tablet ? (
        <rect x="2.5" y="2" width="11" height="12" rx="2" fill="none" stroke={tint} strokeWidth="1.5" />
      ) : (
        <rect x="4" y="1.5" width="8" height="13" rx="2.2" fill="none" stroke={tint} strokeWidth="1.5" />
      )}
      {device.kind === "foldable" && <path d="M8 2v12" stroke={tint} strokeWidth="1" strokeDasharray="1.5 1.5" />}
      {!tablet && <rect x="6.6" y="3.2" width="2.8" height="1" rx="0.5" fill={tint} />}
    </svg>
  );
}
