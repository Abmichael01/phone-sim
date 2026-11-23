import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_SETTINGS, type Settings } from "@/schemas/settings";
import { loadSettings, saveSettings } from "@/shared/settings";
import { isWebUrl } from "@/shared/url";
import { selectSettings, useSimulatorStore } from "@/stores/simulator";
import { App } from "./App";
import "./styles.css";

const sameSettings = (a: Settings, b: Settings): boolean =>
  a.deviceId === b.deviceId &&
  a.orientation === b.orientation &&
  a.zoom === b.zoom &&
  a.screenshotMode === b.screenshotMode &&
  a.sidebarOpen === b.sidebarOpen;

async function boot(): Promise<void> {
  const settings = await loadSettings().catch((error: unknown) => {
    console.error("Phone Sim: saved settings could not be read, using defaults.", error);
    return DEFAULT_SETTINGS;
  });
  const requested = new URLSearchParams(location.search).get("url") ?? undefined;
  useSimulatorStore.getState().init(settings, isWebUrl(requested) ? requested : null);

  // Remember the device and view preferences for the next time the simulator opens.
  useSimulatorStore.subscribe((state, previous) => {
    const next = selectSettings(state);
    if (sameSettings(next, selectSettings(previous))) return;
    saveSettings(next).catch((error: unknown) => console.error("Phone Sim: settings could not be saved.", error));
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
