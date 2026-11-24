import { useEffect, useMemo } from "react";
import { simulatorPagePath } from "@/shared/url";
import { useSimulatorStore } from "@/stores/simulator";
import { CustomDeviceDialog } from "./components/CustomDeviceDialog";
import { LeftRail } from "./components/rail/LeftRail";
import { Stage } from "./components/Stage";
import { Toast } from "./components/Toast";
import { goBack, goForward } from "./frameBridge";
import { useCurrentDevice } from "./hooks/useCurrentDevice";
import { useDeviceRules } from "./hooks/useDeviceRules";
import { useRecording } from "./hooks/useRecording";
import { createCaptureRegistry, useScreenshot } from "./hooks/useScreenshot";
import { useShortcuts } from "./hooks/useShortcuts";

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** Keeps the tab's own address (?url=) and title in step with the active device's site. */
function usePageAddress(): void {
  const activeSlotId = useSimulatorStore((state) => state.activeSlotId);
  const slotHref = useSimulatorStore((state) => state.slotRuntime[activeSlotId]?.frameHref ?? state.slotRuntime[activeSlotId]?.url);
  const fallbackUrl = useSimulatorStore((state) => state.url);
  const current = slotHref ?? fallbackUrl;
  useEffect(() => {
    history.replaceState(null, "", simulatorPagePath(current));
    const host = hostOf(current);
    document.title = host ? `${host} · Phone Sim` : "Phone Sim";
  }, [current]);
}

function useTheme(): void {
  const theme = useSimulatorStore((state) => state.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}

export function App() {
  const registry = useMemo(createCaptureRegistry, []);
  const device = useCurrentDevice();
  const customDialog = useSimulatorStore((state) => state.customDialog);
  const recordingStatus = useSimulatorStore((state) => state.recording.status);
  const takeScreenshot = useScreenshot(registry);
  const recording = useRecording(registry);
  useDeviceRules(device);
  usePageAddress();
  useTheme();

  const store = useSimulatorStore.getState;
  useShortcuts(
    {
      devices: () => store().togglePanel("devices"),
      "add-device": () => store().togglePanel("add-device"),
      backgrounds: () => store().togglePanel("backgrounds"),
      rotate: () => store().rotate(),
      "sync-scroll": () => store().setPreference("syncScroll", !store().syncScroll),
      "prev-device": () => store().cycleActiveSlot(-1),
      "next-device": () => store().cycleActiveSlot(1),
      screenshot: () => void takeScreenshot(),
      "screenshot-screen": () => void takeScreenshot("screen"),
      record: () => (recordingStatus === "recording" ? recording.stop() : void recording.start()),
      "zoom-fit": () => store().setPreference("zoom", "fit"),
      "zoom-100": () => store().setPreference("zoom", "100"),
      "zoom-75": () => store().setPreference("zoom", "75"),
      "zoom-50": () => store().setPreference("zoom", "50"),
      "edit-url": () => store().togglePanel("url"),
      back: () => goBack(),
      forward: () => goForward(),
    },
    customDialog === null,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-stage text-ink">
      <LeftRail
        onScreenshot={(mode) => void takeScreenshot(mode)}
        onRecordStart={() => void recording.start()}
        onRecordStop={recording.stop}
      />
      <Stage registry={registry} />
      {customDialog && <CustomDeviceDialog key={customDialog.mode === "edit" ? customDialog.device.id : "create"} dialog={customDialog} />}
      <Toast />
    </div>
  );
}
