import type { Platform } from "@/schemas/device";

/** Light or dark look of the in-phone status and browser bars (follows the UI theme). */
export type Tone = "light" | "dark";

export interface BarColors {
  bar: string;
  field: string;
  text: string;
  muted: string;
  accent: string;
}

const SAFARI: Record<Tone, BarColors> = {
  light: { bar: "#f6f7f9", field: "#e6e8ee", text: "#11151c", muted: "#757d8a", accent: "#222936" },
  dark: { bar: "#1f2126", field: "#2d3038", text: "#f2f4f8", muted: "#9299a7", accent: "#c7cdd8" },
};

const CHROME: Record<Tone, BarColors> = {
  light: { bar: "#ffffff", field: "#eef0f4", text: "#1a1d24", muted: "#5f6775", accent: "#1a73e8" },
  dark: { bar: "#1f2126", field: "#2d3038", text: "#f2f4f8", muted: "#b4bac6", accent: "#c7cdd8" },
};

export function barColors(platform: Platform, tone: Tone): BarColors {
  return platform === "android" ? CHROME[tone] : SAFARI[tone];
}
