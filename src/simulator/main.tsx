import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { CustomBackground } from "@/schemas/customBackground";
import { DEFAULT_SETTINGS } from "@/schemas/settings";
import type { Device } from "@/schemas/device";
import { loadCustomBackgrounds, onCustomBackgroundsChanged } from "@/shared/customBackgrounds";
import { loadCustomDevices, onCustomDevicesChanged } from "@/shared/customDevices";
import { loadSettings, saveSettings } from "@/shared/settings";
import { isWebUrl } from "@/shared/url";
import { selectSettings, useSimulatorStore } from "@/stores/simulator";
import { App } from "./App";
import "./styles.css";

function logged<T>(what: string, fallback: T): (error: unknown) => T {
  return (error) => {
    console.error(`Phone Sim: ${what}`, error);
    return fallback;
  };
}

async function boot(): Promise<void> {
  const [settings, customDevices, customBackgrounds] = await Promise.all([
    loadSettings().catch(logged("saved settings could not be read, using defaults.", DEFAULT_SETTINGS)),
    loadCustomDevices().catch(logged("custom devices could not be read.", [] as Device[])),
    loadCustomBackgrounds().catch(logged("custom backgrounds could not be read.", [] as CustomBackground[])),
  ]);
  const requested = new URLSearchParams(location.search).get("url") ?? undefined;
  document.documentElement.dataset.theme = settings.theme;
  useSimulatorStore.getState().init(settings, customDevices, customBackgrounds, isWebUrl(requested) ? requested : null);

  // Remember preferences for the next time the simulator opens.
  let saved = JSON.stringify(selectSettings(useSimulatorStore.getState()));
  useSimulatorStore.subscribe((state) => {
    const next = selectSettings(state);
    const serialized = JSON.stringify(next);
    if (serialized === saved) return;
    saved = serialized;
    saveSettings(next).catch((error: unknown) => console.error("Phone Sim: settings could not be saved.", error));
  });

  // Custom devices or wallpapers added or removed in another simulator tab.
  onCustomDevicesChanged((list) => {
    if (JSON.stringify(list) !== JSON.stringify(useSimulatorStore.getState().customDevices)) {
      useSimulatorStore.getState().setCustomDevices(list);
    }
  });
  onCustomBackgroundsChanged((list) => {
    if (JSON.stringify(list) !== JSON.stringify(useSimulatorStore.getState().customBackgrounds)) {
      useSimulatorStore.getState().setCustomBackgrounds(list);
    }
  });

  const root = document.getElementById("root");
  if (!root) throw new Error("Phone Sim: #root is missing from simulator.html");
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
