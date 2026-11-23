import { useEffect, useRef } from "react";
import { simulatorPagePath } from "@/shared/url";
import { useSimulatorStore } from "@/stores/simulator";
import { DevicePicker } from "./components/DevicePicker";
import { Stage } from "./components/Stage";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { useDeviceRules } from "./hooks/useDeviceRules";
import { useRecording } from "./hooks/useRecording";
import { useScreenshot } from "./hooks/useScreenshot";

/** Keeps the tab's own address (?url=) and title in step with the framed site. */
function usePageAddress(): void {
  const url = useSimulatorStore((state) => state.url);
  const frameHref = useSimulatorStore((state) => state.frameHref);
  const current = frameHref ?? url;

  useEffect(() => {
    history.replaceState(null, "", simulatorPagePath(current));
    document.title = current ? `${new URL(current).host} · Phone Sim` : "Phone Sim";
  }, [current]);
}

export function App() {
  const frameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = useSimulatorStore((state) => state.sidebarOpen);
  const takeScreenshot = useScreenshot(frameRef, screenRef);
  const recording = useRecording(frameRef);
  useDeviceRules();
  usePageAddress();

  return (
    <div className="flex h-screen flex-col bg-app text-ink">
      <Toolbar onScreenshot={() => void takeScreenshot()} onRecordStart={() => void recording.start()} onRecordStop={recording.stop} />
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && <DevicePicker />}
        <Stage frameRef={frameRef} screenRef={screenRef} />
      </div>
      <Toast />
    </div>
  );
}
