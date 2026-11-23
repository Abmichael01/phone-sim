import { useEffect, useRef, useState } from "react";
import type { ScreenshotMode, Zoom } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { CameraIcon, CheckIcon, ChevronDownIcon, RecordIcon, RotateIcon, SidebarIcon } from "./icons";
import { RecordingBadge } from "./RecordingBadge";
import { UrlBar } from "./UrlBar";

/** Display order (zod lists numeric-looking enum keys first, so it is spelled out). */
const ZOOM_ORDER: readonly Zoom[] = ["fit", "100", "75", "50"];
const ZOOM_LABEL: Record<Zoom, string> = { fit: "Fit", "100": "100%", "75": "75%", "50": "50%" };
const SCREENSHOT_LABEL: Record<ScreenshotMode, string> = { frame: "With frame", screen: "Screen only" };
const LOCKED_HINT = "Stop recording to change this";

const iconButton =
  "grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-35";

function ZoomControl() {
  const zoom = useSimulatorStore((state) => state.zoom);
  return (
    <div className="flex h-8 shrink-0 items-center rounded-lg bg-panel p-0.5" role="radiogroup" aria-label="Zoom">
      {ZOOM_ORDER.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={zoom === option}
          onClick={() => useSimulatorStore.getState().setZoom(option)}
          className={`h-7 rounded-md px-2 text-xs font-medium tabular-nums ${
            zoom === option ? "bg-raised text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {ZOOM_LABEL[option]}
        </button>
      ))}
    </div>
  );
}

function ScreenshotButton({ onCapture }: { onCapture(): void }) {
  const mode = useSimulatorStore((state) => state.screenshotMode);
  const capturing = useSimulatorStore((state) => state.capturing);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative flex shrink-0">
      <button
        type="button"
        className="flex h-8 items-center gap-1.5 rounded-l-lg bg-panel pl-2.5 pr-2 text-xs font-medium text-ink hover:bg-raised disabled:opacity-50"
        onClick={() => {
          setOpen(false);
          onCapture();
        }}
        disabled={capturing !== null}
        title={`Screenshot (${SCREENSHOT_LABEL[mode].toLowerCase()})`}
      >
        <CameraIcon width={16} height={16} />
        Screenshot
      </button>
      <button
        type="button"
        className="grid h-8 w-6 place-items-center rounded-r-lg border-l border-line bg-panel text-muted hover:bg-raised hover:text-ink"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Screenshot options"
      >
        <ChevronDownIcon width={14} height={14} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-line bg-panel p-1 shadow-2xl">
          {(["frame", "screen"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={mode === option}
              onClick={() => {
                useSimulatorStore.getState().setScreenshotMode(option);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-raised"
            >
              <span className="w-4 text-accent">{mode === option && <CheckIcon width={15} height={15} />}</span>
              {SCREENSHOT_LABEL[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolbarProps {
  onScreenshot(): void;
  onRecordStart(): void;
  onRecordStop(): void;
}

export function Toolbar({ onScreenshot, onRecordStart, onRecordStop }: ToolbarProps) {
  const sidebarOpen = useSimulatorStore((state) => state.sidebarOpen);
  const recording = useSimulatorStore((state) => state.recording);
  const locked = recording.status !== "idle";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-app px-3">
      <button
        type="button"
        className={iconButton}
        onClick={() => useSimulatorStore.getState().toggleSidebar()}
        title={sidebarOpen ? "Hide devices" : "Show devices"}
        aria-label={sidebarOpen ? "Hide devices" : "Show devices"}
        aria-pressed={sidebarOpen}
      >
        <SidebarIcon />
      </button>
      <span className="mr-1 hidden shrink-0 text-sm font-semibold tracking-tight text-ink md:block">Phone Sim</span>
      <UrlBar />
      <div className="ml-1 flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={iconButton}
          onClick={() => useSimulatorStore.getState().rotate()}
          disabled={locked}
          title={locked ? `Rotate: ${LOCKED_HINT}` : "Rotate"}
          aria-label="Rotate"
        >
          <RotateIcon />
        </button>
        <ZoomControl />
        <ScreenshotButton onCapture={onScreenshot} />
        {recording.status === "recording" ? (
          <RecordingBadge startedAt={recording.startedAt} onStop={onRecordStop} />
        ) : (
          <button
            type="button"
            onClick={onRecordStart}
            disabled={recording.status === "starting"}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-panel px-2.5 text-xs font-medium text-ink hover:bg-raised disabled:opacity-60"
            title="Record the device as a video (choose this tab when asked)"
          >
            <RecordIcon width={16} height={16} className="text-danger" />
            {recording.status === "starting" ? "Choose this tab…" : "Record"}
          </button>
        )}
      </div>
    </header>
  );
}
