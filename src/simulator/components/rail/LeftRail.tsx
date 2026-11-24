import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_STAGE_SLOTS, type ScreenshotMode, type Zoom } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { useCurrentDevice } from "../../hooks/useCurrentDevice";
import { useDismiss } from "../../hooks/useDismiss";
import { SHORTCUT_KEYS } from "../../shortcuts";
import {
  BackdropIcon,
  BrandMarkIcon,
  CameraIcon,
  CloseIcon,
  DevicesIcon,
  GearIcon,
  GlobeIcon,
  LockIcon,
  PlusIcon,
  RecordIcon,
  ReloadIcon,
  RotateIcon,
  StopIcon,
  SyncScrollIcon,
} from "../icons";
import { RailButton, Tip } from "../ui";
import { BackgroundsDrawer } from "./BackgroundsDrawer";
import { DevicesDrawer } from "./DevicesDrawer";
import { RecordDrawer } from "./RecordDrawer";
import { ScreenshotDrawer } from "./ScreenshotDrawer";
import { SettingsDrawer } from "./SettingsDrawer";
import { UrlDrawer } from "./UrlDrawer";

const ZOOM_CYCLE: readonly Zoom[] = ["fit", "100", "75", "50"];
const ZOOM_SHORT: Record<Zoom, string> = { fit: "Fit", "100": "100", "75": "75", "50": "50" };

function domainOf(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Closes this simulator tab and brings back the tab it was opened from. */
async function closeSimulator(): Promise<void> {
  const tab = await chrome.tabs.getCurrent();
  if (!tab?.id) return;
  if (tab.openerTabId !== undefined) await chrome.tabs.update(tab.openerTabId, { active: true }).catch(() => undefined);
  await chrome.tabs.remove(tab.id);
}

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function RailRecordingButton({ startedAt, onStop }: { startedAt: number; onStop(): void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <Tip label="Stop recording" keys={SHORTCUT_KEYS.record} side="right">
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop recording"
        className="flex h-12 w-10 flex-col items-center justify-center gap-0.5 rounded-full bg-danger text-[10px] font-semibold text-white transition hover:brightness-110"
      >
        <StopIcon width={12} height={12} />
        <span className="leading-none tabular-nums">{formatElapsed(now - startedAt)}</span>
      </button>
    </Tip>
  );
}

interface LeftRailProps {
  onScreenshot(mode?: ScreenshotMode): void;
  onRecordStart(): void;
  onRecordStop(): void;
}

/**
 * Custom 57px flat left dock rail + anchored slide-out drawers.
 * Exact 8px padding on all sides (p-2) around 40×40 buttons + 1px border; zero drop shadows.
 */
export function LeftRail({ onScreenshot, onRecordStart, onRecordStop }: LeftRailProps) {
  const panel = useSimulatorStore((state) => state.panel);
  const slots = useSimulatorStore((state) => state.slots);
  const url = useSimulatorStore((state) => state.url);
  const zoom = useSimulatorStore((state) => state.zoom);
  const syncScroll = useSimulatorStore((state) => state.syncScroll);
  const recording = useSimulatorStore((state) => state.recording);
  const capturing = useSimulatorStore((state) => state.capturing);
  const activeDevice = useCurrentDevice();
  const locked = recording.status !== "idle";
  const canAdd = slots.length < MAX_STAGE_SLOTS && !locked;
  const secure = url?.startsWith("https://") ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef([containerRef]).current;
  const close = useCallback(() => useSimulatorStore.getState().setPanel(null), []);
  useDismiss(panel !== null, refs, close);

  const cycleZoom = (): void => {
    const next = ZOOM_CYCLE[(ZOOM_CYCLE.indexOf(zoom) + 1) % ZOOM_CYCLE.length] ?? "fit";
    useSimulatorStore.getState().setPreference("zoom", next);
  };

  return (
    <div ref={containerRef} className="relative z-30 flex shrink-0">
      <aside
        aria-label="Phone Sim controls"
        className="flex h-screen w-[57px] flex-col items-center justify-between border-r border-glass-line bg-glass p-2"
      >
        {/* Top: identity + address + multi-device workspace + stage actions */}
        <div className="flex flex-col items-center gap-1">
          <Tip label={`Phone Sim · ${activeDevice.name}`} side="right" disabled={panel !== null}>
            <div className="grid size-10 place-items-center rounded-full text-ink" aria-hidden="true">
              <BrandMarkIcon width={20} height={20} />
            </div>
          </Tip>

          <span className="my-1 h-px w-6 bg-line" aria-hidden="true" />

          <RailButton
            label={domainOf(url) ? `Address · ${domainOf(url)}` : "Enter web address"}
            keys={SHORTCUT_KEYS["edit-url"]}
            active={panel === "url"}
            hideTip={panel !== null}
            aria-expanded={panel === "url"}
            onClick={() => useSimulatorStore.getState().togglePanel("url")}
          >
            <GlobeIcon width={21} height={21} />
            {secure && (
              <span className="absolute right-1.5 bottom-1.5 grid size-3.5 place-items-center rounded-full bg-panel text-emerald-400">
                <LockIcon width={9} height={9} strokeWidth={2.5} />
              </span>
            )}
          </RailButton>

          <RailButton
            label="Devices & stage"
            keys={SHORTCUT_KEYS.devices}
            active={panel === "devices"}
            hideTip={panel !== null}
            aria-expanded={panel === "devices"}
            badge={slots.length}
            onClick={() => useSimulatorStore.getState().togglePanel("devices")}
          >
            <DevicesIcon width={21} height={21} />
          </RailButton>

          <RailButton
            label={canAdd ? "Add device to stage" : `Stage full (${MAX_STAGE_SLOTS} max)`}
            keys={SHORTCUT_KEYS["add-device"]}
            active={panel === "add-device"}
            accent
            hideTip={panel !== null}
            disabled={!canAdd}
            aria-expanded={panel === "add-device"}
            onClick={() => useSimulatorStore.getState().togglePanel("add-device")}
          >
            <PlusIcon width={21} height={21} />
          </RailButton>

          <span className="my-1 h-px w-6 bg-line" aria-hidden="true" />

          <RailButton
            label={slots.length > 1 ? "Reload all devices" : "Reload"}
            disabled={!url}
            hideTip={panel !== null}
            onClick={() => useSimulatorStore.getState().reload()}
          >
            <ReloadIcon width={21} height={21} />
          </RailButton>

          <RailButton
            label={locked ? "Rotate (stop recording first)" : `Rotate ${activeDevice.name}`}
            keys={SHORTCUT_KEYS.rotate}
            disabled={locked}
            hideTip={panel !== null}
            onClick={() => useSimulatorStore.getState().rotate()}
          >
            <RotateIcon width={21} height={21} />
          </RailButton>

          <RailButton
            label={syncScroll ? "Sync scroll: ON" : "Sync scroll: OFF"}
            keys={SHORTCUT_KEYS["sync-scroll"]}
            accent={syncScroll}
            hideTip={panel !== null}
            aria-pressed={syncScroll}
            onClick={() => useSimulatorStore.getState().setPreference("syncScroll", !syncScroll)}
          >
            <SyncScrollIcon width={21} height={21} />
          </RailButton>

          <RailButton
            label="Stage background"
            keys={SHORTCUT_KEYS.backgrounds}
            active={panel === "backgrounds"}
            hideTip={panel !== null}
            aria-expanded={panel === "backgrounds"}
            onClick={() => useSimulatorStore.getState().togglePanel("backgrounds")}
          >
            <BackdropIcon width={21} height={21} />
          </RailButton>

          <RailButton
            label="Screenshot options"
            keys={SHORTCUT_KEYS.screenshot}
            active={panel === "screenshot"}
            hideTip={panel !== null}
            aria-expanded={panel === "screenshot"}
            disabled={capturing !== null}
            onClick={() => useSimulatorStore.getState().togglePanel("screenshot")}
          >
            <CameraIcon width={21} height={21} />
          </RailButton>

          {recording.status === "recording" ? (
            <RailRecordingButton startedAt={recording.startedAt} onStop={onRecordStop} />
          ) : (
            <RailButton
              label={recording.status === "starting" ? "Choose this tab to share…" : `Record ${activeDevice.name} (Manual / Auto-scroll)`}
              keys={SHORTCUT_KEYS.record}
              active={panel === "record"}
              hideTip={panel !== null}
              aria-expanded={panel === "record"}
              disabled={recording.status === "starting"}
              onClick={() => useSimulatorStore.getState().togglePanel("record")}
            >
              <RecordIcon width={21} height={21} />
            </RailButton>
          )}
        </div>

        {/* Bottom: 1-click zoom cycle + settings + close */}
        <div className="flex flex-col items-center gap-1">
          <span className="my-1 h-px w-6 bg-line" aria-hidden="true" />
          <RailButton
            label={`Zoom: ${zoom === "fit" ? "Fit" : `${zoom}%`} (click to cycle)`}
            keys={SHORTCUT_KEYS["zoom-fit"]}
            hideTip={panel !== null}
            onClick={cycleZoom}
            className="text-[11px] font-semibold tabular-nums"
          >
            {ZOOM_SHORT[zoom]}
          </RailButton>
          <RailButton
            label="Settings"
            active={panel === "settings"}
            hideTip={panel !== null}
            aria-expanded={panel === "settings"}
            onClick={() => useSimulatorStore.getState().togglePanel("settings")}
          >
            <GearIcon width={21} height={21} />
          </RailButton>
          <RailButton label="Close simulator" hideTip={panel !== null} onClick={() => void closeSimulator()}>
            <CloseIcon width={21} height={21} />
          </RailButton>
        </div>
      </aside>

      {panel === "url" && <UrlDrawer />}
      {(panel === "devices" || panel === "add-device") && <DevicesDrawer initialMode={panel === "add-device" ? "add" : "swap"} />}
      {panel === "backgrounds" && <BackgroundsDrawer />}
      {panel === "screenshot" && <ScreenshotDrawer onScreenshot={onScreenshot} />}
      {panel === "record" && <RecordDrawer onStart={onRecordStart} />}
      {panel === "settings" && <SettingsDrawer />}
    </div>
  );
}
