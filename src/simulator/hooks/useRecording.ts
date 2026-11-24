import { useCallback, useEffect, useRef } from "react";
import { useSimulatorStore } from "@/stores/simulator";
import { captureFileName, downloadBlob } from "../capture/files";
import { ElementRecorder } from "../capture/recorder";
import { setAutoScrollDoneListener, startAutoScroll, stopAutoScroll } from "../frameBridge";
import type { CaptureRegistry } from "./useScreenshot";

export interface RecordingControls {
  start(overrides?: { autoScroll?: boolean }): Promise<void>;
  stop(): void;
}

/**
 * 60 fps / 16 Mbps recording of the active device:
 * - "frame": strictly the active phone frame only (no rail, no sibling devices)
 * - "stage-bg": active phone framed with studio padding over the chosen stage background (or Chroma Green)
 * - "screen": strictly the inner site viewport only
 * Automatically promotes the active device to full stage height for crisp HD output
 * while keeping sibling frames mounted offscreen (zero reload).
 */
export function useRecording(registry: CaptureRegistry): RecordingControls {
  const recorderRef = useRef<ElementRecorder | null>(null);
  const activeSlotRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (activeSlotRef.current) stopAutoScroll(activeSlotRef.current);
    recorderRef.current?.stop();
  }, []);

  useEffect(() => {
    setAutoScrollDoneListener((slotId) => {
      if (activeSlotRef.current === slotId) recorderRef.current?.stop();
    });
    return () => {
      setAutoScrollDoneListener(null);
      if (activeSlotRef.current) stopAutoScroll(activeSlotRef.current);
      recorderRef.current?.stop();
    };
  }, []);

  const start = useCallback(
    async (overrides?: { autoScroll?: boolean }) => {
      const store = useSimulatorStore.getState();
      const slotId = store.activeSlotId;
      const targets = registry.slots.get(slotId);
      const element =
        store.recordTarget === "screen"
          ? (targets?.viewport ?? null)
          : store.recordTarget === "stage-bg"
            ? (targets?.frameWithBg ?? targets?.frameBox ?? null)
            : (targets?.frameBox ?? null);
      if (store.recording.status !== "idle" || !element) return;

      const deviceId = store.deviceId;
      const autoScroll = overrides?.autoScroll ?? store.autoScrollMode;
      activeSlotRef.current = slotId;
      store.setPanel(null);
      store.setRecording({ status: "starting" });

      const done = (): void => {
        if (activeSlotRef.current) stopAutoScroll(activeSlotRef.current);
        activeSlotRef.current = null;
        recorderRef.current = null;
        useSimulatorStore.getState().setRecording({ status: "idle" });
      };

      try {
        recorderRef.current = await ElementRecorder.start(element, store.captureQuality, {
          onFinish: ({ blob, extension }) => {
            done();
            if (blob.size === 0) {
              useSimulatorStore.getState().showToast("error", "Nothing was recorded.");
              return;
            }
            downloadBlob(blob, captureFileName(deviceId, new Date(), extension));
            useSimulatorStore.getState().showToast("info", "Recording saved to your downloads.");
          },
          onError: (message) => {
            done();
            useSimulatorStore.getState().showToast("error", message);
          },
        });
        useSimulatorStore.getState().setRecording({ status: "recording", startedAt: Date.now(), slotId, autoScroll });
        if (autoScroll) {
          const latest = useSimulatorStore.getState();
          startAutoScroll(slotId, {
            speed: latest.autoScrollSpeed,
            fromTop: latest.autoScrollFromTop,
            delayMs: latest.autoScrollDelayMs,
            stopAtBottom: latest.autoScrollStopAtBottom,
          });
        }
      } catch (error) {
        done();
        const cancelled = error instanceof DOMException && error.name === "NotAllowedError";
        useSimulatorStore
          .getState()
          .showToast(
            cancelled ? "info" : "error",
            cancelled ? "Recording cancelled." : `Recording failed: ${error instanceof Error ? error.message : String(error)}`,
          );
      }
    },
    [registry],
  );

  return { start, stop };
}
