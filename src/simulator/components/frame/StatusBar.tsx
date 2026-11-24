import { cutoutSize } from "@/devices/layout";
import type { Device } from "@/schemas/device";
import type { Orientation } from "@/schemas/settings";
import { formatClock, useClock } from "../../hooks/useClock";
import { barColors, type Tone } from "./tone";

function IosSignal() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <rect key={bar} x={bar * 4.8} y={8.4 - bar * 2.8} width="3.2" height={3.6 + bar * 2.8} rx="0.9" fill="currentColor" />
      ))}
    </svg>
  );
}

function IosWifi() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" fill="currentColor">
      <path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.2C13.3 1.7 10.8.6 8 .6S2.7 1.7.8 3.5L2 4.7c1.6-1.5 3.7-2.4 6-2.4z" />
      <path d="M8 5.6c1.4 0 2.7.5 3.7 1.4l1.2-1.2C11.6 4.6 9.9 3.9 8 3.9s-3.6.7-4.9 1.9L4.3 7C5.3 6.1 6.6 5.6 8 5.6z" />
      <path d="M8 11.4l2.4-2.4C9.8 8.4 8.9 8 8 8s-1.8.4-2.4 1z" />
    </svg>
  );
}

function IosBattery() {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true">
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <rect x="2" y="2" width="18" height="9" rx="2.3" fill="currentColor" />
      <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

function AndroidWifi() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" aria-hidden="true">
      <path d="M7.5 11.6L.2 3.3C2.2 1.6 4.7.6 7.5.6s5.3 1 7.3 2.7z" fill="currentColor" />
    </svg>
  );
}

function AndroidSignal() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M11.6.4v11.2H.4z" fill="currentColor" />
    </svg>
  );
}

function AndroidBattery() {
  return (
    <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true">
      <rect x="2.8" y="0" width="3.4" height="1.6" rx="0.6" fill="currentColor" />
      <rect x="0.5" y="1.3" width="8" height="12.2" rx="1.6" fill="currentColor" fillOpacity="0.35" />
      <rect x="0.5" y="4" width="8" height="9.5" rx="1.6" fill="currentColor" />
    </svg>
  );
}

interface StatusBarProps {
  device: Device;
  orientation: Orientation;
  tone: Tone;
  width: number;
  height: number;
  /** Shows the classic "9:41" demo clock for clean marketing/portfolio captures. */
  demo?: boolean;
}

/** Status bar drawn in the strip reserved above the site (iOS or Android style). */
export function StatusBar({ device, orientation, tone, width, height, demo = false }: StatusBarProps) {
  const live = formatClock(useClock());
  const time = demo ? "9:41" : live;
  if (height <= 0) return null;

  const colors = barColors(device.platform, tone);
  const style = { width, height, background: colors.bar, color: colors.text };
  const base = "absolute inset-x-0 top-0 flex items-center select-none antialiased";
  const { cutout } = device.frame;

  if (device.platform === "android") {
    const leftPad = cutout === "punch-hole-left" && orientation === "portrait" ? 44 : 20;
    return (
      <div className={`${base} justify-between pr-5 text-[13.5px] font-medium tracking-tight`} style={{ ...style, paddingLeft: leftPad }}>
        <span className="tabular-nums">{time}</span>
        <span className="flex items-center gap-[5px]">
          <AndroidWifi />
          <AndroidSignal />
          <AndroidBattery />
        </span>
      </div>
    );
  }

  const icons = (
    <span className="flex items-center gap-[6px]">
      <IosSignal />
      <IosWifi />
      <IosBattery />
    </span>
  );

  if (device.platform === "ipados" || cutout === "none") {
    return (
      <div className={`${base} justify-between px-6 text-[13px] font-semibold`} style={style}>
        <span className="tabular-nums">{time}</span>
        {icons}
      </div>
    );
  }

  if (cutout === "home-button") {
    return (
      <div className={`${base} justify-between px-1.5 text-[12px] font-semibold`} style={style}>
        <span className="flex items-center gap-1 scale-90">
          <IosSignal />
          <IosWifi />
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 tabular-nums">{time}</span>
        <span className="scale-90">
          <IosBattery />
        </span>
      </div>
    );
  }

  // Dynamic Island / notch: time and icons sit in the "ears" either side of the cutout.
  const gap = cutoutSize(device).width + 18;
  return (
    <div className={`${base} text-[16.5px] font-semibold tracking-tight`} style={{ ...style, paddingTop: cutout === "dynamic-island" ? 4 : 0 }}>
      <span className="flex flex-1 justify-center pl-5 tabular-nums">{time}</span>
      <span style={{ width: gap }} />
      <span className="flex flex-1 justify-center pr-5">{icons}</span>
    </div>
  );
}
