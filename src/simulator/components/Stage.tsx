import { useMemo, useRef, type Ref } from "react";
import { resolveDevice } from "@/devices";
import { frameLayout, zoomScale } from "@/devices/layout";
import { useSimulatorStore } from "@/stores/simulator";
import { useElementSize } from "../hooks/useElementSize";
import { DeviceFrame } from "./DeviceFrame";
import { DeviceScreen } from "./DeviceScreen";

/** Space kept around the device, and reserved below it for the caption. */
const PADDING = 32;
const CAPTION_HEIGHT = 56;

interface StageProps {
  frameRef: Ref<HTMLDivElement>;
  screenRef: Ref<HTMLDivElement>;
}

/** Centres the device and scales the whole frame (never the iframe's CSS size). */
export function Stage({ frameRef, screenRef }: StageProps) {
  const containerRef = useRef<HTMLElement>(null);
  const available = useElementSize(containerRef);
  const deviceId = useSimulatorStore((state) => state.deviceId);
  const orientation = useSimulatorStore((state) => state.orientation);
  const zoom = useSimulatorStore((state) => state.zoom);
  const capturing = useSimulatorStore((state) => state.capturing);

  const device = resolveDevice(deviceId);
  const layout = useMemo(() => frameLayout(device, orientation), [device, orientation]);
  const measured = available.width > 0 && available.height > 0;
  const scale = zoomScale(zoom, layout.outer, {
    width: available.width - PADDING * 2,
    height: available.height - PADDING * 2 - CAPTION_HEIGHT,
  });

  return (
    <main ref={containerRef} className="stage relative min-w-0 flex-1 overflow-auto">
      <div
        className="flex min-h-full w-max min-w-full flex-col items-center justify-center"
        style={{ padding: PADDING, visibility: measured ? "visible" : "hidden" }}
      >
        <div style={{ width: layout.outer.width * scale, height: layout.outer.height * scale }}>
          <div style={{ width: layout.outer.width, height: layout.outer.height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <DeviceFrame device={device} layout={layout} capturing={capturing} frameRef={frameRef} screenRef={screenRef}>
              <DeviceScreen device={device} />
            </DeviceFrame>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center" style={{ height: CAPTION_HEIGHT, paddingTop: 16 }}>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            {device.name}
            {device.approx && (
              <span className="rounded-md bg-raised px-1.5 text-[11px] font-medium text-muted" title="Approximate specs: best-known estimate">
                ≈ approx
              </span>
            )}
          </p>
          <p className="text-xs text-muted tabular-nums">
            {device.screen.width} × {device.screen.height} @{device.dpr}x · viewport {layout.viewport.width} × {layout.viewport.height} ·{" "}
            {Math.round(scale * 100)}%
          </p>
        </div>
      </div>
    </main>
  );
}
