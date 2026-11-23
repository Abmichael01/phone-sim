import { useEffect } from "react";
import { useSimulatorStore } from "@/stores/simulator";

const VISIBLE_MS = 4000;

/** One short message at a time, bottom centre; hidden while a screenshot is taken. */
export function Toast() {
  const toast = useSimulatorStore((state) => state.toast);
  const capturing = useSimulatorStore((state) => state.capturing);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => useSimulatorStore.getState().dismissToast(toast.id), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast || capturing) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div
        role={toast.tone === "error" ? "alert" : "status"}
        className={`pointer-events-auto max-w-md rounded-xl border px-4 py-2.5 text-[13px] shadow-xl ${
          toast.tone === "error" ? "border-danger/40 bg-panel text-ink" : "border-line bg-panel text-ink"
        }`}
        onClick={() => useSimulatorStore.getState().dismissToast(toast.id)}
      >
        {toast.tone === "error" && <span className="mr-2 inline-block size-2 rounded-full bg-danger align-middle" />}
        {toast.text}
      </div>
    </div>
  );
}
