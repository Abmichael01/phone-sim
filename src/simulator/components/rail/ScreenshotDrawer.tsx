import type { CaptureQuality, ScreenshotMode } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { CAPTURE_QUALITIES } from "../../capture/quality";
import { CameraIcon } from "../icons";
import { Drawer, Segmented } from "../ui";

export const SCREENSHOT_LABEL: Record<ScreenshotMode, string> = {
  frame: "Active device (with frame)",
  screen: "Active screen only",
  "screen-bars": "Active screen + bars",
  all: "All devices (whole stage)",
};

const BG_MODES: readonly { value: "transparent" | "bg"; label: string }[] = [
  { value: "transparent", label: "No bg (PNG)" },
  { value: "bg", label: "With stage bg" },
];

const QUALITY_OPTIONS: readonly { value: CaptureQuality; label: string }[] = CAPTURE_QUALITIES.map(({ value, label }) => ({
  value,
  label,
}));

/** Left-docked 1-click screenshot drawer: choose resolution, background mode, and capture scope. */
export function ScreenshotDrawer({ onScreenshot }: { onScreenshot(mode?: ScreenshotMode): void }) {
  const defaultMode = useSimulatorStore((state) => state.screenshotMode);
  const includeBg = useSimulatorStore((state) => state.screenshotIncludeBg);
  const quality = useSimulatorStore((state) => state.captureQuality);
  const slotCount = useSimulatorStore((state) => state.slots.length);
  const set = useSimulatorStore.getState().setPreference;

  const modes: ScreenshotMode[] = slotCount > 1 ? ["all", "frame", "screen", "screen-bars"] : ["frame", "screen", "screen-bars", "all"];

  return (
    <Drawer label="Screenshot options" className="top-[244px] w-[304px] space-y-3 p-3.5">
      <div className="space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Quality</p>
        <Segmented<CaptureQuality>
          label="Capture quality"
          value={quality}
          options={QUALITY_OPTIONS}
          onChange={(value) => set("captureQuality", value)}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Background</p>
        <Segmented<"transparent" | "bg">
          label="Screenshot background"
          value={includeBg ? "bg" : "transparent"}
          options={BG_MODES}
          onChange={(value) => {
            set("screenshotIncludeBg", value === "bg");
            if (value === "transparent") set("transparentFrameShot", true);
          }}
        />
      </div>

      <div role="menu" aria-label="Screenshot" className="space-y-0.5 border-t border-line pt-2">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            role="menuitem"
            onClick={() => {
              useSimulatorStore.getState().setPanel(null);
              onScreenshot(mode);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-raised"
          >
            <span className="flex items-center gap-2">
              <CameraIcon width={15} height={15} className="text-muted" />
              {SCREENSHOT_LABEL[mode]}
            </span>
            {mode === defaultMode && <span className="text-[10.5px] text-muted">S</span>}
          </button>
        ))}
      </div>
    </Drawer>
  );
}
