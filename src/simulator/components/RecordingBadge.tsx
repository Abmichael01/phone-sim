import { useEffect, useState } from "react";
import { StopIcon } from "./icons";

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Red recording pill with elapsed time and Stop. */
export function RecordingBadge({ startedAt, onStop }: { startedAt: number; onStop(): void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-8 items-center gap-2 rounded-lg bg-danger/15 pl-2.5 pr-1 text-danger" role="status">
      <span className="size-2 animate-pulse rounded-full bg-danger" />
      <span className="text-xs font-semibold tabular-nums">REC {formatElapsed(now - startedAt)}</span>
      <button
        type="button"
        onClick={onStop}
        className="flex h-6 items-center gap-1 rounded-md bg-danger px-2 text-xs font-semibold text-white hover:brightness-110"
      >
        <StopIcon width={14} height={14} />
        Stop
      </button>
    </div>
  );
}
