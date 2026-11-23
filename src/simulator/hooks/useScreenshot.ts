import { useCallback, type RefObject } from "react";
import { useSimulatorStore } from "@/stores/simulator";
import { captureFileName, downloadBlob } from "../capture/files";
import { captureElementPng } from "../capture/screenshot";

/** Resolves after the browser has painted the current state. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

/** Takes a PNG of the whole device ("frame") or only its screen ("screen"). */
export function useScreenshot(
  frameRef: RefObject<HTMLElement | null>,
  screenRef: RefObject<HTMLElement | null>,
): () => Promise<void> {
  return useCallback(async () => {
    const store = useSimulatorStore.getState();
    if (store.capturing) return;
    const mode = store.screenshotMode;
    const target = mode === "frame" ? frameRef.current : screenRef.current;
    if (!target) return;
    store.setCapturing(mode);
    try {
      await nextPaint();
      const blob = await captureElementPng(target);
      downloadBlob(blob, captureFileName(store.deviceId, new Date(), "png"));
      store.showToast("info", "Screenshot saved to your downloads.");
    } catch (error) {
      store.showToast("error", `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      useSimulatorStore.getState().setCapturing(null);
    }
  }, [frameRef, screenRef]);
}
