import type { ReactNode, Ref } from "react";
import { BUTTON_OVERHANG, type FrameLayout, type Size } from "@/devices/layout";
import type { Device } from "@/schemas/device";
import type { Orientation, ScreenshotMode } from "@/schemas/settings";
import { Crease, Cutout } from "./Cutout";
import { Hardware } from "./Hardware";
import { StatusBar } from "./StatusBar";
import type { Tone } from "./tone";

/**
 * Draws its children upright (portrait) and turns them a quarter counter-clockwise
 * in landscape, centred in the parent. Used for everything that belongs to the
 * hardware (body, buttons, cutout, crease) rather than to the rotated content.
 */
function PortraitLayer({ size, orientation, children }: { size: Size; orientation: Orientation; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: size.width,
        height: size.height,
        transform: `translate(-50%, -50%)${orientation === "landscape" ? " rotate(-90deg)" : ""}`,
      }}
    >
      {children}
    </div>
  );
}

interface DeviceFrameProps {
  device: Device;
  layout: FrameLayout;
  tone: Tone;
  demoStatusBar?: boolean;
  capturing?: ScreenshotMode | null;
  frameRef?: Ref<HTMLDivElement>;
  bodyRef?: Ref<HTMLDivElement>;
  screenRef?: Ref<HTMLDivElement>;
  viewportRef?: Ref<HTMLDivElement>;
  topBar?: ReactNode;
  bottomBar?: ReactNode;
  /** The site (or a state message), sized to layout.viewport. */
  children?: ReactNode;
}

/** The whole device, drawn with CSS from the catalog numbers. */
export function DeviceFrame({
  device,
  layout,
  tone,
  demoStatusBar = false,
  capturing = null,
  frameRef,
  bodyRef,
  screenRef,
  viewportRef,
  topBar,
  bottomBar,
  children,
}: DeviceFrameProps) {
  const { body, screen, statusBar, viewport, bars, orientation } = layout;
  const screenCapture = capturing === "screen" || capturing === "screen-bars";

  return (
    <div ref={frameRef} className="relative" style={{ width: layout.outer.width, height: layout.outer.height }}>
      <div ref={bodyRef} className="absolute" style={{ left: BUTTON_OVERHANG, top: BUTTON_OVERHANG, width: body.width, height: body.height }}>
        <PortraitLayer size={layout.portraitBody} orientation={orientation}>
          <Hardware device={device} layout={layout} />
        </PortraitLayer>
        <div
          ref={screenRef}
          className="absolute overflow-hidden bg-black"
          style={{ left: screen.x, top: screen.y, width: screen.width, height: screen.height, borderRadius: screenCapture ? 0 : device.frame.screenRadius }}
        >
          <StatusBar device={device} orientation={orientation} tone={tone} width={screen.width} height={statusBar} demo={demoStatusBar} />
          {bars.top > 0 && (
            <div className="absolute inset-x-0" style={{ top: statusBar, height: bars.top }}>
              {topBar}
            </div>
          )}
          <div ref={viewportRef} className="absolute" style={{ left: viewport.x, top: viewport.y, width: viewport.width, height: viewport.height }}>
            {children}
          </div>
          {bars.bottom > 0 && (
            <div className="absolute inset-x-0 bottom-0" style={{ height: bars.bottom }}>
              {bottomBar}
            </div>
          )}
          {!screenCapture && (
            <>
              <PortraitLayer size={device.screen} orientation={orientation}>
                <Cutout device={device} />
                {device.frame.crease && <Crease />}
              </PortraitLayer>
              {/* Crisp black matrix edge between front glass and screen pixels. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: device.frame.screenRadius, border: "1px solid #000" }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
