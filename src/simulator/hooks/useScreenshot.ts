import { useCallback } from "react";
import type { ScreenshotMode } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { captureFileName, downloadBlob } from "../capture/files";
import { captureElementPng } from "../capture/screenshot";

/** Resolves after React layout + compositor paint settle (2 rAFs + short frame tick). */
function nextPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(resolve, 40))),
  );
}

export interface SlotCaptureElements {
  /** Un-transformed outer box sized to the scaled device frame (strictly phone only). */
  frameBox: HTMLElement | null;
  /** Un-transformed padded studio wrapper around the phone (includes stage background / chroma green). */
  frameWithBg: HTMLElement | null;
  /** The rounded device body (ideal for transparent-corner frame PNG screenshots). */
  body: HTMLElement | null;
  /** Scaled body corner radius in CSS px for optional transparent PNG corner clipping. */
  bodyRadiusCss: number;
  screen: HTMLElement | null;
  viewport: HTMLElement | null;
}

/** Mutable DOM element registry shared between Stage, useScreenshot and useRecording. */
export interface CaptureRegistry {
  /** Stage <main> viewport (excludes left rail): used to clamp padded background captures. */
  stageCanvas: HTMLElement | null;
  /** Tight flex container holding all devices on stage. */
  stage: HTMLElement | null;
  slots: Map<string, SlotCaptureElements>;
}

export function createCaptureRegistry(): CaptureRegistry {
  return { stageCanvas: null, stage: null, slots: new Map() };
}

export function setSlotCaptureElement(
  registry: CaptureRegistry,
  slotId: string,
  part: "frameBox" | "frameWithBg" | "body" | "screen" | "viewport",
  element: HTMLElement | null,
  bodyRadiusCss?: number,
): void {
  const entry = registry.slots.get(slotId) ?? {
    frameBox: null,
    frameWithBg: null,
    body: null,
    bodyRadiusCss: 0,
    screen: null,
    viewport: null,
  };
  entry[part] = element;
  if (bodyRadiusCss !== undefined) entry.bodyRadiusCss = bodyRadiusCss;
  if (!entry.frameBox && !entry.frameWithBg && !entry.body && !entry.screen && !entry.viewport) registry.slots.delete(slotId);
  else registry.slots.set(slotId, entry);
}

/**
 * Takes a full-DPI PNG in the chosen mode.
 * Single-device captures automatically promote the active phone to full stage height for
 * maximum resolution, while keeping sibling iframes alive offscreen with zero reload.
 */
export function useScreenshot(registry: CaptureRegistry): (mode?: ScreenshotMode) => Promise<void> {
  return useCallback(
    async (requested) => {
      const store = useSimulatorStore.getState();
      if (store.capturing) return;
      const mode = requested ?? store.screenshotMode;
      const includeBg = store.screenshotIncludeBg;

      store.setCapturing(mode);
      try {
        await nextPaint();
        const latest = useSimulatorStore.getState();
        const active = registry.slots.get(latest.activeSlotId);
        const transparentBody = mode === "frame" && !includeBg && latest.transparentFrameShot && active?.body !== null;

        let target: HTMLElement | null = null;
        let padCss = 0;
        let clampTo: HTMLElement | null = null;
        let cornerRadiusCss: number | undefined;

        if (mode === "all") {
          target = includeBg ? (registry.stageCanvas ?? registry.stage) : registry.stage;
        } else if (mode === "frame") {
          if (includeBg) {
            target = active?.frameBox ?? null;
            padCss = 36;
            clampTo = registry.stageCanvas;
          } else {
            target = transparentBody ? (active?.body ?? null) : (active?.frameBox ?? null);
            if (transparentBody) cornerRadiusCss = active?.bodyRadiusCss;
          }
        } else if (mode === "screen-bars") {
          target = active?.screen ?? null;
        } else {
          target = active?.viewport ?? null;
        }

        if (!target) return;
        const blob = await captureElementPng(target, {
          cornerRadiusCss,
          padCss,
          clampTo,
          quality: latest.captureQuality,
        });
        const label = mode === "all" ? "stage" : latest.deviceId;
        downloadBlob(blob, captureFileName(label, new Date(), "png"));
        latest.showToast("info", "Screenshot saved to your downloads.");
      } catch (error) {
        useSimulatorStore.getState().showToast("error", `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        useSimulatorStore.getState().setCapturing(null);
      }
    },
    [registry],
  );
}
