import type { CaptureQuality } from "@/schemas/settings";

export interface QualityProfile {
  value: CaptureQuality;
  label: string;
  /** Target long edge in pixels, or null to preserve exact native display pixels. */
  longEdge: number | null;
  fps: number;
  bitrate: number;
  badge: string;
}

export const CAPTURE_QUALITIES: readonly QualityProfile[] = [
  { value: "720p", label: "720p", longEdge: 1280, fps: 30, bitrate: 6_000_000, badge: "720p · 30fps" },
  { value: "1080p", label: "1080p", longEdge: 1920, fps: 60, bitrate: 16_000_000, badge: "1080p · 60fps" },
  { value: "2k", label: "2K", longEdge: 2560, fps: 60, bitrate: 28_000_000, badge: "2K · 60fps" },
  { value: "native", label: "Native", longEdge: null, fps: 60, bitrate: 18_000_000, badge: "Native · 60fps" },
];

const byValue = new Map<CaptureQuality, QualityProfile>(CAPTURE_QUALITIES.map((q) => [q.value, q]));

export function qualityProfile(quality: CaptureQuality): QualityProfile {
  return byValue.get(quality) ?? CAPTURE_QUALITIES[1]!;
}

/** Even positive integer (>= 2) required by H.264/VP9 4:2:0 video encoders. */
const toEven = (n: number): number => Math.max(2, Math.round(n) & ~1);

/** Computes output pixel dimensions for a screenshot or video recording at the chosen quality preset. */
export function targetCaptureDimensions(
  sourceWidth: number,
  sourceHeight: number,
  quality: CaptureQuality,
  even = false,
): { width: number; height: number } {
  const safeW = Math.max(2, sourceWidth);
  const safeH = Math.max(2, sourceHeight);
  const { longEdge } = qualityProfile(quality);
  const scale = longEdge === null ? 1 : longEdge / Math.max(safeW, safeH);
  const rawW = safeW * scale;
  const rawH = safeH * scale;
  return even
    ? { width: toEven(rawW), height: toEven(rawH) }
    : { width: Math.max(2, Math.round(rawW)), height: Math.max(2, Math.round(rawH)) };
}
