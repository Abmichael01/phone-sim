import type { CSSProperties, ReactNode, Ref } from "react";
import { BUTTON_OVERHANG, sideButtons, type FrameLayout, type SideButton, type Size } from "@/devices/layout";
import type { Device } from "@/schemas/device";
import type { Orientation, ScreenshotMode } from "@/schemas/settings";
import { Crease, Cutout } from "./Cutout";
import { StatusBar } from "./StatusBar";

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

/** Mixes a colour toward grey: visible detail on both black and white fronts. */
const detailShade = (color: string): string => `color-mix(in srgb, ${color} 72%, #6b6b6b)`;

function buttonStyle(button: SideButton, body: Size, color: string): CSSProperties {
  const thickness = BUTTON_OVERHANG + 3;
  const shared: CSSProperties = {
    borderRadius: 2,
    background: `linear-gradient(90deg, color-mix(in srgb, ${color} 78%, #000), ${color} 60%, color-mix(in srgb, ${color} 85%, #fff))`,
  };
  switch (button.edge) {
    case "left":
      return { ...shared, left: -BUTTON_OVERHANG, top: button.start * body.height, width: thickness, height: button.length * body.height };
    case "right":
      return { ...shared, right: -BUTTON_OVERHANG, top: button.start * body.height, width: thickness, height: button.length * body.height };
    case "top":
      return { ...shared, top: -BUTTON_OVERHANG, left: button.start * body.width, height: thickness, width: button.length * body.width };
  }
}

function Body({ device, layout }: { device: Device; layout: FrameLayout }) {
  const { color, cutout, bezel } = device.frame;
  const size = layout.portraitBody;
  const radius = layout.bodyRadius;
  const homeButton = cutout === "home-button";
  const rim = homeButton ? 2 : Math.max(2, Math.min(4, Math.round(bezel * 0.3)));
  const glass = homeButton ? color : "#08090b";
  const edge = homeButton ? `color-mix(in srgb, ${color} 70%, #000)` : color;
  const { top, bottom } = layout.bezels;

  return (
    <>
      {sideButtons(device).map((button) => (
        <div key={`${button.edge}-${button.start}`} className="absolute" style={buttonStyle(button, size, color)} />
      ))}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background: glass,
          boxShadow: `inset 0 0 0 ${rim}px ${edge}, inset 0 0 0 ${rim + 1}px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.55)`,
        }}
      >
        {/* Sheen across the glass and a thin highlight on the rim. */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: radius,
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(0,0,0,0.22) 100%)",
          }}
        />
        <div
          className="absolute"
          style={{ inset: rim / 2, borderRadius: Math.max(0, radius - rim / 2), boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.28)" }}
        />
        {homeButton && (
          <>
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{ top: top / 2 - 3, width: size.width * 0.15, height: 6, background: detailShade(color) }}
            />
            <div
              className="absolute rounded-full"
              style={{ top: top / 2 - 4, left: size.width / 2 - size.width * 0.075 - 22, width: 8, height: 8, background: "#1b1e26" }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: size.height - bottom / 2 - Math.min(bottom * 0.62, size.width * 0.18) / 2,
                width: Math.min(bottom * 0.62, size.width * 0.18),
                height: Math.min(bottom * 0.62, size.width * 0.18),
                boxShadow: `inset 0 0 0 2px ${detailShade(color)}, inset 0 2px 6px rgba(0,0,0,0.25)`,
              }}
            />
          </>
        )}
        {cutout === "none" && bezel >= 12 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={
              device.kind === "tablet"
                ? { top: top / 2 - 3, width: 6, height: 6, background: "#1b1e26" }
                : { top: top / 2 - 1.5, width: size.width * 0.16, height: 3, background: "#22252d" }
            }
          />
        )}
      </div>
    </>
  );
}

interface DeviceFrameProps {
  device: Device;
  layout: FrameLayout;
  capturing: ScreenshotMode | null;
  frameRef: Ref<HTMLDivElement>;
  screenRef: Ref<HTMLDivElement>;
  /** The site (or a state message), sized to layout.viewport. */
  children: ReactNode;
}

/** The whole device, drawn with CSS from the catalog numbers. */
export function DeviceFrame({ device, layout, capturing, frameRef, screenRef, children }: DeviceFrameProps) {
  const { body, screen, statusBar, viewport, orientation } = layout;
  const screenOnly = capturing === "screen";

  return (
    <div ref={frameRef} className="relative" style={{ width: layout.outer.width, height: layout.outer.height }}>
      <div className="absolute" style={{ left: BUTTON_OVERHANG, top: BUTTON_OVERHANG, width: body.width, height: body.height }}>
        <div
          className="absolute inset-0"
          style={{
            borderRadius: layout.bodyRadius,
            boxShadow: "0 50px 90px -40px rgba(0,0,0,0.75), 0 24px 44px -26px rgba(0,0,0,0.6)",
          }}
        />
        <PortraitLayer size={layout.portraitBody} orientation={orientation}>
          <Body device={device} layout={layout} />
        </PortraitLayer>
        <div
          ref={screenRef}
          className="absolute overflow-hidden bg-black"
          style={{
            left: screen.x,
            top: screen.y,
            width: screen.width,
            height: screen.height,
            borderRadius: screenOnly ? 0 : device.frame.screenRadius,
          }}
        >
          <StatusBar device={device} orientation={orientation} width={screen.width} height={statusBar} />
          <div className="absolute left-0" style={{ top: statusBar, width: viewport.width, height: viewport.height }}>
            {children}
          </div>
          {!screenOnly && (
            <PortraitLayer size={device.screen} orientation={orientation}>
              <Cutout device={device} />
              {device.frame.crease && <Crease />}
            </PortraitLayer>
          )}
        </div>
      </div>
    </div>
  );
}
