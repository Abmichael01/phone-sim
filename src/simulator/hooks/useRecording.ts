import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useSimulatorStore } from "@/stores/simulator";
import { captureFileName, downloadBlob } from "../capture/files";
import { ElementRecorder } from "../capture/recorder";

export interface RecordingControls {
  start(): Promise<void>;
  stop(): void;
}

/** Screen recording of the device element; owns the recorder and always releases it. */
export function useRecording(frameRef: RefObject<HTMLElement | null>): RecordingControls {
  const recorderRef = useRef<ElementRecorder | null>(null);

  useEffect(() => () => recorderRef.current?.stop(), []);

  const start = useCallback(async () => {
    const store = useSimulatorStore.getState();
    const element = frameRef.current;
    if (store.recording.status !== "idle" || !element) return;
    const deviceId = store.deviceId;
    store.setRecording({ status: "starting" });
    const done = (): void => {
      recorderRef.current = null;
      useSimulatorStore.getState().setRecording({ status: "idle" });
    };
    try {
      recorderRef.current = await ElementRecorder.start(element, {
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
      useSimulatorStore.getState().setRecording({ status: "recording", startedAt: Date.now() });
    } catch (error) {
      done();
      const cancelled = error instanceof DOMException && error.name === "NotAllowedError";
      useSimulatorStore
        .getState()
        .showToast(cancelled ? "info" : "error", cancelled ? "Recording cancelled." : `Recording failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [frameRef]);

  const stop = useCallback(() => recorderRef.current?.stop(), []);

  return { start, stop };
}
