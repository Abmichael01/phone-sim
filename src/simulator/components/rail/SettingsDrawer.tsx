import { useState, type ReactNode } from "react";
import type { BarTheme, ScreenshotMode, Theme, Zoom } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { useCurrentDevice } from "../../hooks/useCurrentDevice";
import { SHORTCUT_KEYS, SHORTCUT_LIST } from "../../shortcuts";
import { CheckIcon, ChevronDownIcon } from "../icons";
import { Drawer, Segmented, Tip, Toggle } from "../ui";

const THEMES: readonly { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];
const BAR_THEMES: readonly { value: BarTheme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const ZOOMS: readonly { value: Zoom; label: string }[] = [
  { value: "fit", label: "Fit" },
  { value: "100", label: "100%" },
  { value: "75", label: "75%" },
  { value: "50", label: "50%" },
];
const SHOT_MODES: readonly { value: ScreenshotMode; label: string }[] = [
  { value: "frame", label: "Frame" },
  { value: "screen", label: "Screen" },
  { value: "screen-bars", label: "+ Bars" },
  { value: "all", label: "All" },
];

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function isLightHex(color: string): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match?.[1]) return false;
  const rgb = Number.parseInt(match[1], 16);
  const luminance = ((rgb >> 16) & 255) * 0.299 + ((rgb >> 8) & 255) * 0.587 + (rgb & 255) * 0.114;
  return luminance > 155;
}

function FinishPicker() {
  const device = useCurrentDevice();
  const chosen = useSimulatorStore((state) => state.finishes[state.deviceId]);
  const finishes = device.frame.finishes;
  if (!finishes) return null;
  const current = finishes.find((finish) => finish.name === chosen) ?? finishes[0];
  return (
    <Row title={`Finish · ${device.name} · ${current?.name ?? ""}`}>
      <div className="flex flex-wrap gap-2">
        {finishes.map((finish) => {
          const selected = finish.name === current?.name;
          return (
            <Tip key={finish.name} label={finish.name} side="top">
              <button
                type="button"
                aria-label={finish.name}
                aria-pressed={selected}
                onClick={() => useSimulatorStore.getState().setFinish(device.id, finish.name)}
                className={`grid size-7 place-items-center rounded-full transition ${selected ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : "hover:scale-110"}`}
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${finish.color} 60%, #fff), ${finish.color} 45%, color-mix(in srgb, ${finish.color} 65%, #000))`,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {selected && <CheckIcon width={13} height={13} className={isLightHex(finish.color) ? "text-black/85" : "text-white"} />}
              </button>
            </Tip>
          );
        })}
      </div>
    </Row>
  );
}

/** Compact left-docked settings drawer with collapsible shortcuts accordion. */
export function SettingsDrawer() {
  const theme = useSimulatorStore((state) => state.theme);
  const barTheme = useSimulatorStore((state) => state.barTheme);
  const browserBars = useSimulatorStore((state) => state.browserBars);
  const statusBar = useSimulatorStore((state) => state.statusBar);
  const demoStatusBar = useSimulatorStore((state) => state.demoStatusBar);
  const touchCursor = useSimulatorStore((state) => state.touchCursor);
  const syncScroll = useSimulatorStore((state) => state.syncScroll);
  const syncNav = useSimulatorStore((state) => state.syncNav);
  const zoom = useSimulatorStore((state) => state.zoom);
  const screenshotMode = useSimulatorStore((state) => state.screenshotMode);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const set = useSimulatorStore.getState().setPreference;

  return (
    <Drawer label="Settings" className="no-scrollbar bottom-2 max-h-[calc(100vh-16px)] w-[328px] space-y-3.5 overflow-y-auto p-4">
      <div className="grid grid-cols-[112px_1fr] gap-2.5">
        <Row title="UI Theme">
          <Segmented<Theme> label="UI Theme" value={theme} options={THEMES} onChange={(value) => set("theme", value)} />
        </Row>
        <Row title="Phone Bars">
          <Segmented<BarTheme> label="Phone bars tone" value={barTheme} options={BAR_THEMES} onChange={(value) => set("barTheme", value)} />
        </Row>
      </div>

      <div className="-mx-1.5 space-y-0.5">
        <Toggle label="Browser bars" checked={browserBars} onChange={(value) => set("browserBars", value)} />
        <Toggle label="Status bar" checked={statusBar} onChange={(value) => set("statusBar", value)} />
        <Toggle label="Clean demo clock (9:41)" checked={demoStatusBar} onChange={(value) => set("demoStatusBar", value)} />
        <Toggle label="Touch cursor & drag scroll" checked={touchCursor} onChange={(value) => set("touchCursor", value)} />
        <Toggle label="Sync scroll across devices" checked={syncScroll} onChange={(value) => set("syncScroll", value)} />
        <Toggle label="Sync link navigation" checked={syncNav} onChange={(value) => set("syncNav", value)} />
      </div>

      <Row title="Zoom · Ctrl + wheel">
        <Segmented<Zoom> label="Zoom" value={zoom} options={ZOOMS} onChange={(value) => set("zoom", value)} />
      </Row>

      <Row title="Instant screenshot (S)">
        <Segmented<ScreenshotMode> label="Screenshot default" value={screenshotMode} options={SHOT_MODES} onChange={(value) => set("screenshotMode", value)} />
      </Row>

      <FinishPicker />

      <div className="border-t border-line pt-2.5">
        <button
          type="button"
          aria-expanded={showShortcuts}
          onClick={() => setShowShortcuts((open) => !open)}
          className="flex w-full items-center justify-between rounded-full px-2.5 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          <span>Keyboard shortcuts</span>
          <ChevronDownIcon width={14} height={14} className={`transition-transform ${showShortcuts ? "rotate-180" : ""}`} />
        </button>
        {showShortcuts && (
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 px-2 text-[12px]">
            {SHORTCUT_LIST.map(({ action, label }) => (
              <div key={action} className="contents">
                <dt className="text-ink/80">{label}</dt>
                <dd>
                  <kbd className="rounded-full bg-raised px-2 py-0.5 font-sans text-[10.5px] text-muted">{SHORTCUT_KEYS[action]}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <p className="border-t border-line pt-2.5 text-[11px] text-muted">
        Phone Sim v{chrome.runtime.getManifest().version} · free, private, no tracking
      </p>
    </Drawer>
  );
}
