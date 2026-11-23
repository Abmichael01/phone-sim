import type { Device } from "@/schemas/device";
import { cutoutSize } from "@/devices/layout";

const LENS = "radial-gradient(circle at 38% 38%, #3a4152 0, #14161c 38%, #020203 70%)";

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

/** Camera cutout over the top of the screen, in upright (portrait) screen coordinates. */
export function Cutout({ device }: { device: Device }) {
  const { width, height } = cutoutSize(device);
  switch (device.frame.cutout) {
    case "dynamic-island":
      return (
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black" style={{ top: 11, width, height }}>
          <div className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{ right: 12, width: 11, height: 11, background: LENS }} />
        </div>
      );
    case "notch":
      return (
        <svg className="absolute left-1/2 top-0 -translate-x-1/2" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path d={notchPath(width, height)} fill="#000" />
          <circle cx={width * 0.68} cy={height * 0.45} r={4.5} fill="#151821" />
          <rect x={width * 0.36} y={height * 0.3} width={width * 0.24} height={4} rx={2} fill="#141414" />
        </svg>
      );
    case "punch-hole-center":
    case "punch-hole-left":
      return (
        <div
          className="absolute rounded-full"
          style={{
            top: 9,
            left: device.frame.cutout === "punch-hole-left" ? 18 : `calc(50% - ${width / 2}px)`,
            width,
            height,
            background: LENS,
            boxShadow: "0 0 0 1.5px #000",
          }}
        />
      );
    case "waterdrop":
      return (
        <svg className="absolute left-1/2 top-0 -translate-x-1/2" width={width} height={height} viewBox="0 0 40 22" aria-hidden="true">
          <path d="M0 0 C8 0 10 3 11.5 7.5 A9 9 0 1 0 28.5 7.5 C30 3 32 0 40 0 Z" fill="#000" />
          <circle cx="20" cy="11" r="3.5" fill="#151821" />
        </svg>
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
      className="absolute inset-y-0 left-1/2 w-[6px] -translate-x-1/2"
      style={{
        background:
          "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.07) 30%, rgba(255,255,255,0.22) 50%, rgba(0,0,0,0.07) 70%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
}
