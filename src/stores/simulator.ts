import { create } from "zustand";
import { DEFAULT_DEVICE_ID, findDevice } from "@/devices";
import type { CustomBackground } from "@/schemas/customBackground";
import type { Device } from "@/schemas/device";
import {
  DEFAULT_SETTINGS,
  DEFAULT_SLOTS,
  DEFAULT_TABLET_ID,
  MAX_STAGE_SLOTS,
  RECENT_DEVICES_LIMIT,
  type DeviceSlot,
  type Orientation,
  type ScreenshotMode,
  type Settings,
} from "@/schemas/settings";
import type { FrameNav } from "@/shared/messages";
import { EMPTY_HISTORY, recordNavigation, requestTraverse, type FrameHistory } from "./frameHistory";

/** What a framed site is doing, as far as the simulator can tell. */
export type FrameStatus = "loading" | "loaded" | "unreachable";

export interface SlotRuntime {
  url: string | null;
  frameHref: string | null;
  frameHistory: FrameHistory;
  frameStatus: FrameStatus;
  reloadNonce: number;
}

export type RecordingState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "recording"; startedAt: number; slotId: string; autoScroll: boolean };

export interface Toast {
  id: number;
  tone: "info" | "error";
  text: string;
}

/** Slide-out drawers anchored to the left rail; only one is open at a time. */
export type Panel = "url" | "devices" | "add-device" | "backgrounds" | "screenshot" | "record" | "settings";

export type CustomDialog = { mode: "create" } | { mode: "edit"; device: Device };

export type StagePreset = "phone-tablet" | "two-phones" | "single";

/** Settings the user toggles directly (everything except slots, active device and lists). */
export type PreferenceKey =
  | "zoom"
  | "screenshotMode"
  | "screenshotIncludeBg"
  | "transparentFrameShot"
  | "captureQuality"
  | "theme"
  | "stageBg"
  | "barTheme"
  | "browserBars"
  | "statusBar"
  | "demoStatusBar"
  | "touchCursor"
  | "syncScroll"
  | "syncNav"
  | "recordTarget"
  | "autoScrollMode"
  | "autoScrollSpeed"
  | "autoScrollFromTop"
  | "autoScrollDelayMs"
  | "autoScrollStopAtBottom";

interface SimulatorState extends Settings {
  customDevices: Device[];
  customBackgrounds: CustomBackground[];
  activeSlotId: string;
  /** When non-null, temporarily expands only this slot to fill the whole stage without losing the multi-device layout. */
  soloSlotId: string | null;
  /** Per-slot runtime state (live URL, history, loading status, reload counter). */
  slotRuntime: Record<string, SlotRuntime>;
  /** Current stage-level URL (used for newly added slots and empty-state detection). */
  url: string | null;
  /** True once the background worker has applied initial header rules for this tab. */
  rulesReady: boolean;
  recording: RecordingState;
  /** Set while a screenshot is being taken, so the UI can hide overlays. */
  capturing: ScreenshotMode | null;
  toast: Toast | null;
  panel: Panel | null;
  customDialog: CustomDialog | null;
}

interface SimulatorActions {
  init(settings: Settings, customDevices: Device[], customBackgrounds: CustomBackground[], url: string | null): void;
  setActiveSlot(slotId: string): void;
  cycleActiveSlot(delta: 1 | -1): void;
  toggleSoloSlot(slotId?: string): void;
  exitSolo(): void;
  reorderSlot(slotId: string, direction: -1 | 1): void;
  selectDevice(deviceId: string, targetSlotId?: string): void;
  addDevice(deviceId: string): void;
  removeSlot(slotId: string): void;
  applyPreset(preset: StagePreset): void;
  rotate(slotId?: string): void;
  setPreference<K extends PreferenceKey>(key: K, value: Settings[K]): void;
  setFinish(deviceId: string, finishName: string): void;
  setCustomDevices(list: Device[]): void;
  setCustomBackgrounds(list: CustomBackground[]): void;
  navigate(url: string): void;
  reload(slotId?: string): void;
  setRulesReady(ready: boolean): void;
  setSlotFrameStatus(slotId: string, status: FrameStatus): void;
  /** Records a frame navigation and returns sibling slotIds that should soft-sync via SPA nav (no reload). */
  reportFrame(slotId: string, href: string, nav: FrameNav): string[];
  resetSlotHistory(slotId: string): void;
  /** Marks a back/forward as requested; returns false when there is nowhere to go. */
  requestTraverse(slotId: string, direction: "back" | "forward"): boolean;
  setRecording(recording: RecordingState): void;
  setCapturing(mode: ScreenshotMode | null): void;
  showToast(tone: Toast["tone"], text: string): void;
  dismissToast(id: number): void;
  setPanel(panel: Panel | null): void;
  togglePanel(panel: Panel): void;
  setCustomDialog(dialog: CustomDialog | null): void;
}

export type SimulatorStore = SimulatorState & SimulatorActions;

const flip: Record<Orientation, Orientation> = { portrait: "landscape", landscape: "portrait" };

let toastId = 0;
let slotCounter = 0;

function nextSlotId(): string {
  slotCounter += 1;
  return `slot-${Date.now().toString(36)}-${slotCounter}`;
}

export function emptyRuntime(url: string | null): SlotRuntime {
  return {
    url,
    frameHref: null,
    frameHistory: EMPTY_HISTORY,
    frameStatus: "loading",
    reloadNonce: 0,
  };
}

function rememberRecent(recent: readonly string[], deviceId: string): string[] {
  return [deviceId, ...recent.filter((id) => id !== deviceId)].slice(0, RECENT_DEVICES_LIMIT);
}

function originOf(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function activeFromSlots(slots: readonly DeviceSlot[], preferredId: string): DeviceSlot {
  return slots.find((slot) => slot.slotId === preferredId) ?? slots[0] ?? DEFAULT_SLOTS[0]!;
}

function buildRuntimeMap(slots: readonly DeviceSlot[], url: string | null, existing?: Record<string, SlotRuntime>): Record<string, SlotRuntime> {
  const map: Record<string, SlotRuntime> = {};
  for (const slot of slots) {
    map[slot.slotId] = existing?.[slot.slotId] ?? emptyRuntime(url);
  }
  return map;
}

const initialSlots = DEFAULT_SLOTS.map((slot) => ({ ...slot }));

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  ...DEFAULT_SETTINGS,
  slots: initialSlots,
  activeSlotId: initialSlots[0]!.slotId,
  soloSlotId: null,
  slotRuntime: buildRuntimeMap(initialSlots, null),
  customDevices: [],
  customBackgrounds: [],
  url: null,
  rulesReady: false,
  recording: { status: "idle" },
  capturing: null,
  toast: null,
  panel: null,
  customDialog: null,

  init: (settings, customDevices, customBackgrounds, url) => {
    const validSlots = settings.slots.map((slot) => ({
      ...slot,
      deviceId: findDevice(slot.deviceId, customDevices) ? slot.deviceId : DEFAULT_DEVICE_ID,
    }));
    const slots = validSlots.length > 0 ? validSlots : DEFAULT_SLOTS.map((slot) => ({ ...slot }));
    const active = slots[0]!;
    const hasCustomBg = !settings.stageBg.startsWith("custom-bg-") || customBackgrounds.some((bg) => bg.id === settings.stageBg);
    set({
      ...settings,
      stageBg: hasCustomBg ? settings.stageBg : DEFAULT_SETTINGS.stageBg,
      slots,
      activeSlotId: active.slotId,
      soloSlotId: null,
      deviceId: active.deviceId,
      orientation: active.orientation,
      slotRuntime: buildRuntimeMap(slots, url),
      customDevices,
      customBackgrounds,
      url,
    });
  },

  setActiveSlot: (slotId) => {
    const state = get();
    if (state.recording.status !== "idle") return;
    const slot = state.slots.find((item) => item.slotId === slotId);
    if (!slot || slot.slotId === state.activeSlotId) return;
    set({ activeSlotId: slot.slotId, deviceId: slot.deviceId, orientation: slot.orientation });
  },

  cycleActiveSlot: (delta) => {
    const state = get();
    if (state.recording.status !== "idle" || state.slots.length <= 1) return;
    const index = state.slots.findIndex((item) => item.slotId === state.activeSlotId);
    const next = state.slots[(index + delta + state.slots.length) % state.slots.length];
    if (next) {
      set({
        activeSlotId: next.slotId,
        deviceId: next.deviceId,
        orientation: next.orientation,
        ...(state.soloSlotId ? { soloSlotId: next.slotId } : {}),
      });
    }
  },

  toggleSoloSlot: (slotId) => {
    const state = get();
    if (state.slots.length <= 1) return;
    const target = slotId ?? state.activeSlotId;
    if (state.soloSlotId === target) {
      set({ soloSlotId: null });
      return;
    }
    const slot = state.slots.find((item) => item.slotId === target);
    if (!slot) return;
    set({ soloSlotId: slot.slotId, activeSlotId: slot.slotId, deviceId: slot.deviceId, orientation: slot.orientation });
  },

  exitSolo: () => set({ soloSlotId: null }),

  reorderSlot: (slotId, direction) => {
    const state = get();
    if (state.recording.status !== "idle") return;
    const index = state.slots.findIndex((slot) => slot.slotId === slotId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.slots.length) return;
    const next = [...state.slots];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    set({ slots: next });
  },

  selectDevice: (deviceId, targetSlotId) => {
    const state = get();
    if (state.recording.status !== "idle" || !findDevice(deviceId, state.customDevices)) return;
    const slotId = targetSlotId ?? state.activeSlotId;
    const slots = state.slots.map((slot) => (slot.slotId === slotId ? { ...slot, deviceId } : slot));
    const active = activeFromSlots(slots, slotId);
    const currentRt = state.slotRuntime[slotId] ?? emptyRuntime(state.url);
    const changed = state.slots.find((slot) => slot.slotId === slotId)?.deviceId !== deviceId;
    set({
      slots,
      activeSlotId: active.slotId,
      deviceId: active.deviceId,
      orientation: active.orientation,
      recentDeviceIds: rememberRecent(state.recentDeviceIds, deviceId),
      ...(changed
        ? {
            slotRuntime: {
              ...state.slotRuntime,
              [slotId]: { ...currentRt, frameStatus: "loading" },
            },
          }
        : {}),
    });
  },

  addDevice: (deviceId) => {
    const state = get();
    if (state.recording.status !== "idle" || !findDevice(deviceId, state.customDevices)) return;
    if (state.slots.length >= MAX_STAGE_SLOTS) {
      state.showToast("info", `Up to ${MAX_STAGE_SLOTS} devices can be shown side by side.`);
      return;
    }
    const activeUrl = state.slotRuntime[state.activeSlotId]?.frameHref ?? state.url;
    const slot: DeviceSlot = { slotId: nextSlotId(), deviceId, orientation: "portrait" };
    const slots = [...state.slots, slot];
    set({
      slots,
      activeSlotId: slot.slotId,
      soloSlotId: null,
      deviceId: slot.deviceId,
      orientation: slot.orientation,
      recentDeviceIds: rememberRecent(state.recentDeviceIds, deviceId),
      slotRuntime: { ...state.slotRuntime, [slot.slotId]: emptyRuntime(activeUrl) },
    });
  },

  removeSlot: (slotId) => {
    const state = get();
    if (state.recording.status !== "idle" || state.slots.length <= 1) return;
    const slots = state.slots.filter((slot) => slot.slotId !== slotId);
    if (slots.length === state.slots.length) return;
    const active = activeFromSlots(slots, state.activeSlotId);
    const nextRuntime = { ...state.slotRuntime };
    delete nextRuntime[slotId];
    set({
      slots,
      activeSlotId: active.slotId,
      soloSlotId: state.soloSlotId === slotId || slots.length <= 1 ? null : state.soloSlotId,
      deviceId: active.deviceId,
      orientation: active.orientation,
      slotRuntime: nextRuntime,
    });
  },

  applyPreset: (preset) => {
    const state = get();
    if (state.recording.status !== "idle") return;
    const currentUrl = state.slotRuntime[state.activeSlotId]?.frameHref ?? state.url;
    const nextSlots: DeviceSlot[] =
      preset === "phone-tablet"
        ? [
            { slotId: "slot-phone", deviceId: DEFAULT_DEVICE_ID, orientation: "portrait" },
            { slotId: "slot-tablet", deviceId: DEFAULT_TABLET_ID, orientation: "portrait" },
          ]
        : preset === "two-phones"
          ? [
              { slotId: "slot-iphone", deviceId: DEFAULT_DEVICE_ID, orientation: "portrait" },
              { slotId: "slot-pixel", deviceId: "pixel-9-pro", orientation: "portrait" },
            ]
          : [{ slotId: "slot-single", deviceId: state.deviceId, orientation: state.orientation }];
    const active = nextSlots[0]!;
    set({
      slots: nextSlots,
      activeSlotId: active.slotId,
      soloSlotId: null,
      deviceId: active.deviceId,
      orientation: active.orientation,
      slotRuntime: buildRuntimeMap(nextSlots, currentUrl),
    });
  },

  rotate: (slotId) => {
    const state = get();
    if (state.recording.status !== "idle") return;
    const target = slotId ?? state.activeSlotId;
    const slots = state.slots.map((slot) =>
      slot.slotId === target ? { ...slot, orientation: flip[slot.orientation] } : slot,
    );
    const active = activeFromSlots(slots, state.activeSlotId);
    set({ slots, orientation: active.orientation });
  },

  setPreference: (key, value) => set({ [key]: value }),

  setFinish: (deviceId, finishName) => set((state) => ({ finishes: { ...state.finishes, [deviceId]: finishName } })),

  setCustomDevices: (customDevices) => {
    const state = get();
    const slots = state.slots.map((slot) =>
      findDevice(slot.deviceId, customDevices) ? slot : { ...slot, deviceId: DEFAULT_DEVICE_ID },
    );
    const active = activeFromSlots(slots, state.activeSlotId);
    set({
      customDevices,
      slots,
      activeSlotId: active.slotId,
      deviceId: active.deviceId,
      orientation: active.orientation,
      recentDeviceIds: state.recentDeviceIds.filter((id) => findDevice(id, customDevices)),
    });
  },

  setCustomBackgrounds: (customBackgrounds) => {
    const state = get();
    const stillExists = !state.stageBg.startsWith("custom-bg-") || customBackgrounds.some((bg) => bg.id === state.stageBg);
    set({
      customBackgrounds,
      ...(stillExists ? {} : { stageBg: DEFAULT_SETTINGS.stageBg }),
    });
  },

  navigate: (url) =>
    set((state) => {
      const nextRuntime: Record<string, SlotRuntime> = {};
      for (const slot of state.slots) {
        const prev = state.slotRuntime[slot.slotId] ?? emptyRuntime(url);
        nextRuntime[slot.slotId] = {
          url,
          frameHref: null,
          frameHistory: EMPTY_HISTORY,
          frameStatus: "loading",
          reloadNonce: prev.reloadNonce + 1,
        };
      }
      return { url, slotRuntime: nextRuntime, panel: state.panel === "url" ? null : state.panel };
    }),

  reload: (slotId) =>
    set((state) => {
      const nextRuntime = { ...state.slotRuntime };
      const targets = slotId ? state.slots.filter((slot) => slot.slotId === slotId) : state.slots;
      for (const slot of targets) {
        const prev = state.slotRuntime[slot.slotId] ?? emptyRuntime(state.url);
        nextRuntime[slot.slotId] = {
          ...prev,
          url: prev.frameHref ?? prev.url ?? state.url,
          frameStatus: "loading",
          reloadNonce: prev.reloadNonce + 1,
        };
      }
      return { slotRuntime: nextRuntime };
    }),

  setRulesReady: (rulesReady) => set({ rulesReady }),

  setSlotFrameStatus: (slotId, frameStatus) =>
    set((state) => {
      const prev = state.slotRuntime[slotId];
      if (!prev) return {};
      return { slotRuntime: { ...state.slotRuntime, [slotId]: { ...prev, frameStatus } } };
    }),

  reportFrame: (slotId, href, nav) => {
    const state = get();
    const prev = state.slotRuntime[slotId];
    if (!prev) return [];
    const userNavigated = prev.frameHref !== null && prev.frameHref !== href;
    const softTargets: string[] = [];
    const nextRuntime: Record<string, SlotRuntime> = {
      ...state.slotRuntime,
      [slotId]: {
        ...prev,
        frameHref: href,
        frameHistory: recordNavigation(prev.frameHistory, href, nav),
      },
    };
    if (state.syncNav && userNavigated) {
      const nextOrigin = originOf(href);
      const isSpaNav = nav !== "load";
      for (const sibling of state.slots) {
        if (sibling.slotId === slotId) continue;
        const sibRt = nextRuntime[sibling.slotId];
        if (!sibRt || sibRt.frameHref === href) continue;
        const sibOrigin = originOf(sibRt.frameHref ?? sibRt.url);
        if (isSpaNav && nextOrigin !== null && sibOrigin === nextOrigin) {
          // Soft SPA sync: keep <iframe src> unchanged so React/Next/Vue never hard-reloads.
          nextRuntime[sibling.slotId] = {
            ...sibRt,
            frameHref: href,
            frameHistory: recordNavigation(sibRt.frameHistory, href, nav),
          };
          softTargets.push(sibling.slotId);
        } else if (sibRt.url !== href) {
          nextRuntime[sibling.slotId] = {
            ...sibRt,
            url: href,
            frameStatus: "loading",
          };
        }
      }
    }
    set({
      slotRuntime: nextRuntime,
      ...(slotId === state.activeSlotId ? { url: href } : {}),
    });
    return softTargets;
  },

  resetSlotHistory: (slotId) =>
    set((state) => {
      const prev = state.slotRuntime[slotId];
      if (!prev) return {};
      return { slotRuntime: { ...state.slotRuntime, [slotId]: { ...prev, frameHistory: EMPTY_HISTORY } } };
    }),

  requestTraverse: (slotId, direction) => {
    const prev = get().slotRuntime[slotId];
    if (!prev) return false;
    const { frameHistory } = prev;
    const possible = direction === "back" ? frameHistory.index > 0 : frameHistory.index < frameHistory.entries.length - 1;
    if (possible) {
      set((state) => {
        const current = state.slotRuntime[slotId];
        if (!current) return {};
        return {
          slotRuntime: {
            ...state.slotRuntime,
            [slotId]: { ...current, frameHistory: requestTraverse(current.frameHistory, direction) },
          },
        };
      });
    }
    return possible;
  },

  setRecording: (recording) => set({ recording }),
  setCapturing: (capturing) => set({ capturing, ...(capturing ? { panel: null } : {}) }),

  showToast: (tone, text) => {
    toastId += 1;
    set({ toast: { id: toastId, tone, text } });
  },

  dismissToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },

  setPanel: (panel) => set({ panel }),
  togglePanel: (panel) => set((state) => ({ panel: state.panel === panel ? null : panel })),
  setCustomDialog: (customDialog) => set({ customDialog, panel: null }),
}));

/** The settings slice that is persisted to chrome.storage.local. */
export function selectSettings(state: SimulatorStore): Settings {
  return {
    deviceId: state.deviceId,
    orientation: state.orientation,
    slots: state.slots,
    zoom: state.zoom,
    screenshotMode: state.screenshotMode,
    screenshotIncludeBg: state.screenshotIncludeBg,
    transparentFrameShot: state.transparentFrameShot,
    captureQuality: state.captureQuality,
    theme: state.theme,
    stageBg: state.stageBg,
    barTheme: state.barTheme,
    browserBars: state.browserBars,
    statusBar: state.statusBar,
    demoStatusBar: state.demoStatusBar,
    touchCursor: state.touchCursor,
    syncScroll: state.syncScroll,
    syncNav: state.syncNav,
    recordTarget: state.recordTarget,
    autoScrollMode: state.autoScrollMode,
    autoScrollSpeed: state.autoScrollSpeed,
    autoScrollFromTop: state.autoScrollFromTop,
    autoScrollDelayMs: state.autoScrollDelayMs,
    autoScrollStopAtBottom: state.autoScrollStopAtBottom,
    recentDeviceIds: state.recentDeviceIds,
    finishes: state.finishes,
  };
}
