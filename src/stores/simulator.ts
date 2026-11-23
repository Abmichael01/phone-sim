import { create } from "zustand";
import { resolveDevice } from "@/devices";
import type { Orientation, ScreenshotMode, Settings, Zoom } from "@/schemas/settings";
import { DEFAULT_SETTINGS } from "@/schemas/settings";

/** What the framed site is doing, as far as the simulator can tell. */
export type FrameStatus = "loading" | "loaded" | "unreachable";

export type RecordingState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "recording"; startedAt: number };

export interface Toast {
  id: number;
  tone: "info" | "error";
  text: string;
}

interface SimulatorState extends Settings {
  /** Page loaded into the frame; null shows the "type a URL" state. */
  url: string | null;
  /** Latest URL the framed site reported (follows in-site navigation). */
  frameHref: string | null;
  /** Bumped to force the iframe to load again. */
  reloadNonce: number;
  /** Device whose header rules are active for this tab; the frame waits for it. */
  rulesDeviceId: string | null;
  frameStatus: FrameStatus;
  recording: RecordingState;
  /** Set while a screenshot is being taken, so the UI can hide overlays. */
  capturing: ScreenshotMode | null;
  toast: Toast | null;
}

interface SimulatorActions {
  init(settings: Settings, url: string | null): void;
  selectDevice(deviceId: string): void;
  rotate(): void;
  setZoom(zoom: Zoom): void;
  setScreenshotMode(mode: ScreenshotMode): void;
  toggleSidebar(): void;
  navigate(url: string): void;
  reload(): void;
  setRulesDevice(deviceId: string | null): void;
  setFrameStatus(status: FrameStatus): void;
  reportFrameHref(href: string): void;
  setRecording(recording: RecordingState): void;
  setCapturing(mode: ScreenshotMode | null): void;
  showToast(tone: Toast["tone"], text: string): void;
  dismissToast(id: number): void;
}

export type SimulatorStore = SimulatorState & SimulatorActions;

const flip: Record<Orientation, Orientation> = { portrait: "landscape", landscape: "portrait" };

let toastId = 0;

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  ...DEFAULT_SETTINGS,
  url: null,
  frameHref: null,
  reloadNonce: 0,
  rulesDeviceId: null,
  frameStatus: "loading",
  recording: { status: "idle" },
  capturing: null,
  toast: null,

  init: (settings, url) => set({ ...settings, deviceId: resolveDevice(settings.deviceId).id, url, frameHref: null }),

  selectDevice: (deviceId) => {
    const state = get();
    if (state.recording.status !== "idle" || deviceId === state.deviceId) return;
    set({ deviceId: resolveDevice(deviceId).id, rulesDeviceId: null, frameStatus: "loading" });
  },

  rotate: () => {
    if (get().recording.status !== "idle") return;
    set((state) => ({ orientation: flip[state.orientation] }));
  },

  setZoom: (zoom) => set({ zoom }),
  setScreenshotMode: (screenshotMode) => set({ screenshotMode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  navigate: (url) =>
    set((state) => ({ url, frameHref: null, frameStatus: "loading", reloadNonce: state.reloadNonce + 1 })),

  reload: () => set((state) => ({ frameStatus: "loading", reloadNonce: state.reloadNonce + 1 })),

  setRulesDevice: (rulesDeviceId) => set({ rulesDeviceId }),
  setFrameStatus: (frameStatus) => set({ frameStatus }),
  reportFrameHref: (frameHref) => set({ frameHref }),
  setRecording: (recording) => set({ recording }),
  setCapturing: (capturing) => set({ capturing }),

  showToast: (tone, text) => {
    toastId += 1;
    set({ toast: { id: toastId, tone, text } });
  },

  dismissToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
}));

/** The settings slice that is persisted to chrome.storage.local. */
export function selectSettings(state: SimulatorStore): Settings {
  return {
    deviceId: state.deviceId,
    orientation: state.orientation,
    zoom: state.zoom,
    screenshotMode: state.screenshotMode,
    sidebarOpen: state.sidebarOpen,
  };
}
