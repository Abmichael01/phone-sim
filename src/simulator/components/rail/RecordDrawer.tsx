import type { CaptureQuality, RecordTarget, StageBgChoice } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { CAPTURE_QUALITIES, qualityProfile } from "../../capture/quality";
import { useCurrentDevice } from "../../hooks/useCurrentDevice";
import { RecordIcon } from "../icons";
import { Drawer, Segmented, Toggle } from "../ui";

let previousBgBeforeChroma: StageBgChoice = "dark-dots";

const MODES: readonly { value: "manual" | "auto"; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "auto", label: "Auto-scroll" },
];

const TARGETS: readonly { value: RecordTarget; label: string }[] = [
  { value: "frame", label: "Phone" },
  { value: "stage-bg", label: "With bg" },
  { value: "screen", label: "Screen" },
];

const QUALITY_OPTIONS: readonly { value: CaptureQuality; label: string }[] = CAPTURE_QUALITIES.map(({ value, label }) => ({
  value,
  label,
}));

const TARGET_HELP: Record<RecordTarget, string> = {
  frame: "Crops tightly to this phone only — no rail or stage.",
  "stage-bg": "Frames this phone over your stage bg (or Chroma Green).",
  screen: "Records only the inner website viewport — no bezel.",
};

const SPEEDS: readonly { value: number; label: string }[] = [
  { value: 60, label: "Slow" },
  { value: 120, label: "Smooth" },
  { value: 240, label: "Fast" },
  { value: 360, label: "Turbo" },
];

const DELAYS: readonly { value: "0" | "1000" | "2000"; label: string }[] = [
  { value: "0", label: "0s" },
  { value: "1000", label: "1s" },
  { value: "2000", label: "2s" },
];

/**
 * Left-docked HD recording drawer: selectable quality (720p / 1080p / 2K / Native),
 * Phone only / With bg / Screen only crop, 1-click Chroma Green screen toggle,
 * and configurable Auto-scroll mode.
 */
export function RecordDrawer({ onStart }: { onStart(): void }) {
  const device = useCurrentDevice();
  const url = useSimulatorStore((state) => state.url);
  const stageBg = useSimulatorStore((state) => state.stageBg);
  const recordTarget = useSimulatorStore((state) => state.recordTarget);
  const quality = useSimulatorStore((state) => state.captureQuality);
  const autoScrollMode = useSimulatorStore((state) => state.autoScrollMode);
  const speed = useSimulatorStore((state) => state.autoScrollSpeed);
  const fromTop = useSimulatorStore((state) => state.autoScrollFromTop);
  const delayMs = useSimulatorStore((state) => state.autoScrollDelayMs);
  const stopAtBottom = useSimulatorStore((state) => state.autoScrollStopAtBottom);
  const set = useSimulatorStore.getState().setPreference;

  const isChromaGreen = stageBg === "chroma-green";
  const delayValue: "0" | "1000" | "2000" = delayMs >= 1500 ? "2000" : delayMs >= 500 ? "1000" : "0";
  const profile = qualityProfile(quality);

  const toggleChromaGreen = (on: boolean): void => {
    if (on) {
      if (stageBg !== "chroma-green") previousBgBeforeChroma = stageBg;
      set("stageBg", "chroma-green");
      if (recordTarget === "screen") set("recordTarget", "stage-bg");
    } else {
      set("stageBg", previousBgBeforeChroma === "chroma-green" ? "dark-dots" : previousBgBeforeChroma);
    }
  };

  return (
    <Drawer label="Record phone" className="no-scrollbar bottom-2 max-h-[calc(100vh-16px)] w-[324px] space-y-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-semibold text-ink">Record {device.name}</h2>
          <p className="text-[11.5px] text-muted">{TARGET_HELP[recordTarget]}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold text-accent-ink tabular-nums">
          {profile.badge}
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Quality</p>
        <Segmented<CaptureQuality>
          label="Recording quality"
          value={quality}
          options={QUALITY_OPTIONS}
          onChange={(value) => set("captureQuality", value)}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Capture area</p>
        <Segmented<RecordTarget> label="Capture area" value={recordTarget} options={TARGETS} onChange={(value) => set("recordTarget", value)} />
      </div>

      {recordTarget !== "screen" && (
        <div className="-mx-1.5">
          <Toggle label="Chroma green screen (#00ff00)" checked={isChromaGreen} onChange={toggleChromaGreen} />
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Recording mode</p>
        <Segmented<"manual" | "auto">
          label="Recording mode"
          value={autoScrollMode ? "auto" : "manual"}
          options={MODES}
          onChange={(value) => set("autoScrollMode", value === "auto")}
        />
      </div>

      {autoScrollMode && (
        <div className="space-y-3 rounded-2xl border border-line bg-raised/45 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-ink">Scroll speed</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink tabular-nums">{speed} px/s</span>
            </div>
            <input
              type="range"
              min={30}
              max={450}
              step={10}
              value={speed}
              aria-label="Auto-scroll speed"
              onChange={(event) => set("autoScrollSpeed", Number(event.target.value))}
              className="w-full cursor-pointer accent-[var(--color-accent)]"
            />
            <div className="grid grid-cols-4 gap-1">
              {SPEEDS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => set("autoScrollSpeed", preset.value)}
                  className={`rounded-full py-1 text-[11px] font-medium transition-colors ${
                    speed === preset.value ? "bg-accent text-accent-ink" : "bg-raised text-muted hover:text-ink"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Hero pause before scroll</p>
            <Segmented<"0" | "1000" | "2000">
              label="Hero pause"
              value={delayValue}
              options={DELAYS}
              onChange={(value) => set("autoScrollDelayMs", Number(value))}
            />
          </div>

          <div className="-mx-1.5 space-y-0.5">
            <Toggle label="Start from top of page" checked={fromTop} onChange={(value) => set("autoScrollFromTop", value)} />
            <Toggle label="Auto-stop at bottom" checked={stopAtBottom} onChange={(value) => set("autoScrollStopAtBottom", value)} />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={autoScrollMode && !url}
        onClick={onStart}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-danger text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-45"
      >
        <RecordIcon width={16} height={16} />
        {autoScrollMode ? "Start auto-scroll recording" : "Start recording"}
      </button>
    </Drawer>
  );
}
