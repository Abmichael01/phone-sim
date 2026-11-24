import type { CSSProperties } from "react";
import type { CustomBackground } from "@/schemas/customBackground";

export type StageBackgroundId =
  | "dark-dots"
  | "cobalt-dots"
  | "matte-obsidian"
  | "matte-light"
  | "chroma-green"
  | "chroma-blue"
  | "dark-topo"
  | "cobalt-aurora"
  | "code-bokeh"
  | "cyber-horizon"
  | "emerald-wave"
  | "blueprint-grid";

export interface StageBackground {
  id: StageBackgroundId;
  name: string;
  group: "studio" | "wallpaper";
  /** Path inside public/ (loaded via chrome.runtime.getURL), or undefined for pure CSS patterns/solids. */
  image?: string;
  /** CSS background used directly on the stage (and as thumbnail preview). */
  css: string;
  /** Extra CSS properties such as backgroundSize for tiled patterns. */
  size?: string;
  /** Whether the wallpaper is light-toned. */
  light?: boolean;
}

export const DEFAULT_STAGE_BG: StageBackgroundId = "dark-dots";

export const STAGE_BACKGROUNDS: readonly StageBackground[] = [
  {
    id: "dark-dots",
    name: "Dark Dots",
    group: "studio",
    css: "radial-gradient(rgba(255, 255, 255, 0.14) 1.25px, transparent 1.25px), #10131a",
    size: "22px 22px",
  },
  {
    id: "cobalt-dots",
    name: "Cobalt Dots",
    group: "studio",
    css: "radial-gradient(rgba(96, 165, 250, 0.24) 1.25px, transparent 1.25px), #0b101d",
    size: "22px 22px",
  },
  {
    id: "matte-obsidian",
    name: "Obsidian",
    group: "studio",
    css: "#0c0e14",
  },
  {
    id: "matte-light",
    name: "Studio Light",
    group: "studio",
    css: "radial-gradient(rgba(15, 23, 42, 0.1) 1.15px, transparent 1.15px), #eef0f4",
    size: "22px 22px",
    light: true,
  },
  {
    id: "chroma-green",
    name: "Chroma Green",
    group: "studio",
    css: "#00ff00",
    light: true,
  },
  {
    id: "chroma-blue",
    name: "Chroma Blue",
    group: "studio",
    css: "#0047ff",
  },
  {
    id: "dark-topo",
    name: "Dark Topo",
    group: "wallpaper",
    css: [
      "repeating-radial-gradient(circle at 22% 30%, transparent 0 22px, rgba(148, 163, 184, 0.1) 22px 23px)",
      "repeating-radial-gradient(circle at 78% 76%, transparent 0 29px, rgba(148, 163, 184, 0.07) 29px 30px)",
      "linear-gradient(135deg, #0c1018 0%, #111622 100%)",
    ].join(", "),
  },
  {
    id: "cobalt-aurora",
    name: "Cobalt Aurora",
    group: "wallpaper",
    css: [
      "radial-gradient(ellipse 60% 45% at 20% 25%, rgba(59, 130, 246, 0.45), transparent 70%)",
      "radial-gradient(ellipse 50% 40% at 82% 35%, rgba(139, 92, 246, 0.35), transparent 70%)",
      "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(14, 165, 233, 0.3), transparent 70%)",
      "linear-gradient(135deg, #070a12 0%, #102046 100%)",
    ].join(", "),
  },
  {
    id: "code-bokeh",
    name: "Editor Bokeh",
    group: "wallpaper",
    css: [
      "radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.32) 0 40px, transparent 90px)",
      "radial-gradient(circle at 70% 15%, rgba(244, 114, 182, 0.26) 0 30px, transparent 80px)",
      "radial-gradient(circle at 86% 62%, rgba(250, 204, 21, 0.2) 0 50px, transparent 110px)",
      "radial-gradient(circle at 28% 76%, rgba(167, 139, 250, 0.28) 0 60px, transparent 130px)",
      "radial-gradient(circle at 56% 46%, rgba(52, 211, 153, 0.16) 0 25px, transparent 70px)",
      "linear-gradient(135deg, #090c14 0%, #121c33 100%)",
    ].join(", "),
  },
  {
    id: "cyber-horizon",
    name: "Cyber Horizon",
    group: "wallpaper",
    // Layers, top to bottom: floor grid lines, horizon glow, floor, sun, sky.
    css: [
      "repeating-linear-gradient(180deg, rgba(168, 85, 247, 0.45) 0 1px, transparent 1px 26px) 0 100% / 100% 42% no-repeat",
      "repeating-linear-gradient(90deg, rgba(168, 85, 247, 0.3) 0 1px, transparent 1px 48px) 0 100% / 100% 42% no-repeat",
      "radial-gradient(ellipse 60% 20% at 50% 58%, rgba(236, 72, 153, 0.5), transparent 70%)",
      "linear-gradient(180deg, #12082a, #060a14) 0 100% / 100% 42% no-repeat",
      "radial-gradient(circle 90px at 50% 58%, #fbbf24 0, #fb7185 60%, #c026d3 88%, transparent 90px)",
      "linear-gradient(180deg, #060914 0%, #1a0f3a 58%)",
    ].join(", "),
  },
  {
    id: "emerald-wave",
    name: "Terminal Wave",
    group: "wallpaper",
    css: [
      "repeating-radial-gradient(ellipse 160% 70% at 50% 125%, transparent 0 24px, rgba(52, 211, 153, 0.1) 27px 28px, transparent 31px)",
      "radial-gradient(ellipse 70% 50% at 15% 85%, rgba(16, 185, 129, 0.4), transparent 70%)",
      "radial-gradient(ellipse 60% 40% at 85% 15%, rgba(45, 212, 191, 0.25), transparent 70%)",
      "linear-gradient(135deg, #060b0a 0%, #0b2421 100%)",
    ].join(", "),
  },
  {
    id: "blueprint-grid",
    name: "Blueprint Grid",
    group: "wallpaper",
    css: [
      "linear-gradient(rgba(59, 130, 246, 0.13) 1px, transparent 1px)",
      "linear-gradient(90deg, rgba(59, 130, 246, 0.13) 1px, transparent 1px)",
      "linear-gradient(180deg, #0a0f1c 0%, #0d1424 100%)",
    ].join(", "),
    size: "32px 32px, 32px 32px, 100% 100%",
  },
];

const byId = new Map<StageBackgroundId, StageBackground>(STAGE_BACKGROUNDS.map((bg) => [bg.id, bg]));

export function getStageBackground(id: string): StageBackground {
  return byId.get(id as StageBackgroundId) ?? STAGE_BACKGROUNDS[0]!;
}

/** Resolves either a user's locally saved photo or a built-in backdrop to an inline stage style. */
export function resolveStageBackgroundStyle(stageBg: string, customBackgrounds: readonly CustomBackground[]): CSSProperties {
  const custom = customBackgrounds.find((item) => item.id === stageBg);
  if (custom) {
    return {
      backgroundImage: `url("${custom.dataUrl}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#0a0d14",
    };
  }
  return stageBackgroundStyle(getStageBackground(stageBg));
}

/** Resolves extension-bundled image URL safely (works in both browser extension and Vitest). */
function resolveAssetUrl(path: string): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }
  return `/${path}`;
}

/** Inline style object to render a background on the stage or inside a picker thumbnail. */
export function stageBackgroundStyle(bg: StageBackground): CSSProperties {
  if (bg.image) {
    const url = resolveAssetUrl(bg.image);
    return {
      backgroundImage: `url("${url}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#0a0d14",
    };
  }
  return {
    background: bg.css,
    ...(bg.size ? { backgroundSize: bg.size } : {}),
  };
}
