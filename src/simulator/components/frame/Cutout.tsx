import type { CSSProperties } from "react";
import { cutoutSize } from "@/devices/layout";
import type { Device } from "@/schemas/device";

/** Front camera glass: deep black with a small blue / violet coating reflection. */
const LENS =
  "radial-gradient(circle at 34% 32%, rgba(190,200,255,0.95) 0 5%, rgba(110,92,210,0.6) 13%, rgba(30,34,80,0.9) 30%, #07070d 52%, #000 72%)";

function notchPath(width: number, height: number): string {
  const fillet = 6;
  const corner = Math.min(20, height - fillet);
  return [
    "M0 0",
    `Q${fillet} 0 ${fillet} ${fillet}`,
    `L${fillet} ${height - corner}`,
    `A${corner} ${corner} 0 0 0 ${fillet + corner} ${height}`,
    `L${width - fillet - corner} ${height}`,
    `A${corner} ${corner} 0 0 0 ${width - fillet} ${height - corner}`,
    `L${width - fillet} ${fillet}`,
    `Q${width - fillet} 0 ${width} 0`,
    "Z",
  ].join(" ");
}

function Lens({ size, style }: { size: number; style: CSSProperties }) {
  return (
    <span
      className="absolute rounded-full"
      style={{ width: size, height: size, background: LENS, ...style }}
    />
  );
}

/** Camera cutout over the top of the screen, in upright (portrait) screen coordinates. */
export function Cutout({ device }: { device: Device }) {
  const { width, height } = cutoutSize(device);
  switch (device.frame.cutout) {
    case "dynamic-island":
      return (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
          style={{ top: 11, width, height, border: "0.5px solid rgba(255,255,255,0.05)" }}
        >
          {/* Face ID area (barely visible) and the front camera on the right. */}
          <span className="absolute top-1/2 h-[14px] w-[30px] -translate-y-1/2 rounded-full bg-[#07070a]" style={{ left: 30 }} />
          <Lens size={12} style={{ right: 13, top: "50%", transform: "translateY(-50%)" }} />
        </div>
      );
    case "notch":
      return (
        <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width, height }}>
          <svg className="absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <path d={notchPath(width, height)} fill="#000" />
          </svg>
          {/* Earpiece slit, camera and proximity sensor inside the notch. */}
          <span className="absolute left-1/2 h-[4px] -translate-x-1/2 rounded-full bg-[#1b1c20]" style={{ top: 6, width: width * 0.26 }} />
          <Lens size={9} style={{ left: width * 0.66, top: height * 0.32 }} />
          <span className="absolute size-[5px] rounded-full bg-[#0d0d12]" style={{ left: width * 0.28, top: height * 0.42 }} />
        </div>
      );
    case "punch-hole-center":
    case "punch-hole-left":
      return (
        <div
          className="absolute rounded-full bg-black"
          style={{
            top: 9,
            left: device.frame.cutout === "punch-hole-left" ? 18 : `calc(50% - ${width / 2}px)`,
            width,
            height,
            border: "1px solid #000",
          }}
        >
          <Lens size={8} style={{ left: 1, top: 1 }} />
        </div>
      );
    case "waterdrop":
      return (
        <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width, height }}>
          <svg className="absolute inset-0" width={width} height={height} viewBox="0 0 40 22" aria-hidden="true">
            <path d="M0 0 C8 0 10 3 11.5 7.5 A9 9 0 1 0 28.5 7.5 C30 3 32 0 40 0 Z" fill="#000" />
          </svg>
          <Lens size={8} style={{ left: 16, top: 7 }} />
        </div>
      );
    case "home-button":
    case "none":
      return null;
  }
}

/** Faint fold line down the middle of a foldable's inner screen. */
export function Crease() {
  return (
    <div
      className="absolute inset-y-0 left-1/2 w-[8px] -translate-x-1/2"
      style={{
        background:
          "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 30%, rgba(255,255,255,0.2) 48%, rgba(0,0,0,0.08) 56%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
}
