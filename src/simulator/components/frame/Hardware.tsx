import type { CSSProperties } from "react";
import { antennaBands, BUTTON_OVERHANG, frameStyle, sideButtons, type FrameLayout, type SideButton } from "@/devices/layout";
import type { Device } from "@/schemas/device";

/** Shade helpers: everything is derived from the device colour, so any finish looks like machined metal. */
const lighten = (color: string, amount: number): string => `color-mix(in srgb, ${color} ${100 - amount}%, #ffffff)`;
const darken = (color: string, amount: number): string => `color-mix(in srgb, ${color} ${100 - amount}%, #000000)`;

/** Fine satin micro-grain SVG overlaid on the outer anodized metal shell (bundled inline, zero network). */
const BRUSHED_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95 2.4' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.55'/%3E%3C/svg%3E\")";

/**
 * Rich brushed anodized titanium / aluminum metal finish:
 * specular light catches the four curved corners while the sides stay deep and satin.
 */
function metalBackground(color: string): string {
  return [
    "conic-gradient(from 215deg at 50% 50%, rgba(255,255,255,0.24) 0deg, rgba(255,255,255,0.03) 34deg, rgba(0,0,0,0.22) 86deg, rgba(255,255,255,0.20) 142deg, rgba(255,255,255,0.02) 184deg, rgba(0,0,0,0.26) 244deg, rgba(255,255,255,0.22) 314deg, rgba(255,255,255,0.24) 360deg)",
    "repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 1px, rgba(0,0,0,0.03) 1px 2px)",
    `linear-gradient(155deg, ${lighten(color, 24)} 0%, ${color} 26%, ${darken(color, 18)} 62%, ${darken(color, 34)} 100%)`,
  ].join(", ");
}

/** Machined chamfer highlight gradient catching light around the outer bevel ring. */
function chamferGradient(color: string): string {
  return `conic-gradient(from 215deg at 50% 50%, ${lighten(color, 58)} 0deg, ${lighten(color, 14)} 48deg, ${darken(color, 26)} 98deg, ${lighten(color, 46)} 146deg, ${lighten(color, 10)} 192deg, ${darken(color, 30)} 250deg, ${lighten(color, 54)} 314deg, ${lighten(color, 58)} 360deg)`;
}

function buttonStyle(button: SideButton, height: number, width: number, color: string): CSSProperties {
  const along = button.edge === "top" ? width : height;
  const glassy = button.variant === "camera-control";
  const protrude = glassy ? 1.3 : Math.min(2.2, BUTTON_OVERHANG - 0.6);
  const thickness = protrude + 4;
  const across = button.edge === "top" ? "180deg" : button.edge === "left" ? "90deg" : "270deg";
  const lengthAxis = button.edge === "top" ? "90deg" : "180deg";
  const shared: CSSProperties = {
    borderRadius: 1.75,
    border: `0.5px solid ${glassy ? "rgba(255,255,255,0.12)" : darken(color, 42)}`,
    background: glassy
      ? `linear-gradient(${across}, #14161b, #3a3e48 52%, #181a20)`
      : [
          `linear-gradient(${lengthAxis}, ${lighten(color, 44)} 0%, rgba(255,255,255,0) 14%, rgba(0,0,0,0) 86%, ${darken(color, 44)} 100%)`,
          `linear-gradient(${across}, ${darken(color, 30)} 0%, ${lighten(color, 28)} 38%, ${color} 68%, ${darken(color, 20)} 100%)`,
        ].join(", "),
  };
  const start = button.start * along;
  const length = button.length * along;
  switch (button.edge) {
    case "left":
      return { ...shared, left: -protrude, top: start, width: thickness, height: length };
    case "right":
      return { ...shared, right: -protrude, top: start, width: thickness, height: length };
    case "top":
      return { ...shared, top: -protrude, left: start, height: thickness, width: length };
  }
}

/** Plastic antenna lines crossing the anodized metal rim. */
function AntennaBands({ device, rim, color }: { device: Device; rim: number; color: string }) {
  const band = `color-mix(in srgb, ${color} 62%, #6d7078)`;
  return (
    <>
      {antennaBands(device).map(({ edge, at }) => {
        const horizontal = edge === "left" || edge === "right";
        const style: CSSProperties = horizontal
          ? { [edge]: 0, top: `calc(${at * 100}% - 1px)`, width: rim + 1, height: 2 }
          : { [edge]: 0, left: `calc(${at * 100}% - 1px)`, height: rim + 1, width: 2 };
        return <span key={`${edge}-${at}`} className="absolute" style={{ ...style, background: band, opacity: 0.72 }} />;
      })}
    </>
  );
}

/** Hinge of a foldable: a segmented bar on the left (cover screen) or caps top and bottom (inner screen). */
function Hinge({ hinge, rim, color }: { hinge: "left" | "center"; rim: number; color: string }) {
  const metal = `linear-gradient(90deg, ${darken(color, 36)}, ${lighten(color, 18)} 45%, ${darken(color, 28)})`;
  if (hinge === "left") {
    return (
      <span
        className="absolute"
        style={{
          left: -1.5,
          top: "4%",
          bottom: "4%",
          width: rim + 3,
          borderRadius: 3,
          background: `repeating-linear-gradient(180deg, rgba(0,0,0,0.22) 0 1px, rgba(0,0,0,0) 1px 26px), ${metal}`,
        }}
      />
    );
  }
  return (
    <>
      {(["top", "bottom"] as const).map((edge) => (
        <span
          key={edge}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ [edge]: -1, width: 20, height: rim + 2, borderRadius: 2, background: metal }}
        />
      ))}
    </>
  );
}

/** Earpiece, sensors, home button: whatever sits on the front glass outside the screen. */
function FrontDetails({ device, layout, rim }: { device: Device; layout: FrameLayout; rim: number }) {
  const { width } = layout.portraitBody;
  const { top, bottom } = layout.bezels;
  const { cutout, color } = device.frame;
  const slit: CSSProperties = { background: "#111318", border: "0.5px solid rgba(255,255,255,0.08)" };

  if (cutout === "home-button") {
    const button = Math.min(bottom * 0.62, width * 0.18);
    const detail = `color-mix(in srgb, ${color} 70%, #6b6b6b)`;
    return (
      <>
        <span className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ ...slit, top: top / 2 - 2.5, width: width * 0.14, height: 5, background: detail }} />
        <span
          className="absolute rounded-full"
          style={{ top: top / 2 - 5, left: width / 2 - width * 0.07 - 22, width: 10, height: 10, background: "radial-gradient(circle at 35% 35%, #4b4f8c 0 12%, #111225 40%, #050507 70%)" }}
        />
        <span className="absolute rounded-full bg-[#0b0b0f]" style={{ top: top / 2 - 2.5, left: width / 2 - 3, width: 5, height: 5, transform: `translateY(-${top * 0.22}px)` }} />
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: layout.portraitBody.height - bottom / 2 - button / 2,
            width: button,
            height: button,
            background: `radial-gradient(circle at 40% 35%, ${lighten(color, 5)}, ${darken(color, 6)})`,
            border: `2px solid ${detail}`,
          }}
        />
      </>
    );
  }

  if (device.kind === "tablet") {
    return (
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ top: Math.max(rim + 2, top / 2 - 3), width: 6, height: 6, background: "radial-gradient(circle at 35% 35%, #4b4f8c 0 14%, #0c0d1a 50%, #000 80%)" }}
      />
    );
  }

  // Unfolded inner screens have an under-display or hidden camera and a hinge cap at the top centre.
  if (device.kind === "foldable" && cutout === "none") return null;

  // Phones: earpiece slit along the top edge of the glass; older bezel phones also show camera + sensor.
  const slitWidth = Math.min(width * 0.13, 52);
  const slitTop = cutout === "none" ? top / 2 - 1.75 : rim + 0.9;
  return (
    <>
      {cutout !== "notch" && (
        <span className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ ...slit, top: slitTop, width: cutout === "none" ? width * 0.18 : slitWidth, height: cutout === "none" ? 3.5 : 2.2 }} />
      )}
      {cutout === "none" && (
        <>
          <span
            className="absolute rounded-full"
            style={{ top: top / 2 - 4, left: width / 2 - width * 0.09 - 18, width: 8, height: 8, background: "radial-gradient(circle at 35% 35%, #5a5fa8 0 12%, #121327 45%, #000 75%)" }}
          />
          <span className="absolute rounded-full bg-[#121317]" style={{ top: top / 2 - 2, left: width / 2 + width * 0.09 + 10, width: 4, height: 4 }} />
        </>
      )}
    </>
  );
}

/**
 * The device body drawn upright: machined side buttons, multi-layered brushed anodized
 * metal rim with specular chamfer catch-light, recessed gasket seam, antenna lines,
 * hinge, deep black front glass and front details. Zero outer drop shadows.
 */
export function Hardware({ device, layout }: { device: Device; layout: FrameLayout }) {
  const style = frameStyle(device);
  const { color, cutout } = device.frame;
  const { width, height } = layout.portraitBody;
  const radius = layout.bodyRadius;
  const rim = style.rim;
  const homeButton = cutout === "home-button";
  const chamferInset = Math.min(1.3, rim * 0.32);

  return (
    <>
      {sideButtons(device).map((button) => (
        <span key={`${button.edge}-${button.start}`} className="absolute" style={buttonStyle(button, height, width, color)} />
      ))}

      {/* Layer 1: Brushed anodized metallic shell */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: radius,
          background: metalBackground(color),
          border: `1px solid ${darken(color, 38)}`,
        }}
      >
        {/* Micro-satin metallic grain strictly on the metal shell */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: BRUSHED_GRAIN,
            backgroundSize: "64px 64px",
            mixBlendMode: "overlay",
            opacity: 0.24,
          }}
        />

        {/* Layer 2: Variable-brightness anodized specular chamfer bevel catching light on the curved corners */}
        <div
          className="pointer-events-none absolute"
          style={{
            inset: chamferInset,
            borderRadius: Math.max(0, radius - chamferInset),
            padding: 1.35,
            background: chamferGradient(color),
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <AntennaBands device={device} rim={rim} color={color} />
        {style.hinge && <Hinge hinge={style.hinge} rim={rim} color={color} />}

        {/* Layer 3: Recessed dark metal-to-glass gasket seam */}
        <div
          className="pointer-events-none absolute"
          style={{
            inset: Math.max(0, rim - 1),
            borderRadius: Math.max(0, radius - rim + 1),
            border: "1px solid rgba(0, 0, 0, 0.88)",
          }}
        />

        {/* Layer 4: Glossy deep black front glass bezel with subtle vertical studio sheen */}
        <div
          className="absolute overflow-hidden"
          style={{
            inset: rim,
            borderRadius: Math.max(0, radius - rim),
            background: homeButton
              ? `linear-gradient(160deg, ${lighten(color, 5)} 0%, ${color} 45%, ${darken(color, 6)} 100%)`
              : "linear-gradient(168deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.015) 14%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 84%, rgba(255,255,255,0.03) 100%), #040507",
            border: "1px solid rgba(255, 255, 255, 0.065)",
          }}
        />

        <div className="absolute" style={{ inset: 0 }}>
          <FrontDetails device={device} layout={layout} rim={rim} />
        </div>
      </div>
    </>
  );
}
