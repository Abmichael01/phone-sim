import type { Device } from "@/schemas/device";
import type { Orientation } from "@/schemas/settings";
import { cutoutSize } from "@/devices/layout";
import { formatClock, useClock } from "../hooks/useClock";

function IosSignal() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <rect key={bar} x={bar * 4.5} y={8 - bar * 2.6} width="3" height={3 + bar * 2.6} rx="0.8" fill="currentColor" />
      ))}
    </svg>
  );
}

function IosWifi() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden="true" fill="currentColor">
      <path d="M7.5 2.2c2.2 0 4.2.8 5.8 2.2l1.1-1.1C12.5 1.6 10.1.6 7.5.6S2.5 1.6.6 3.3l1.1 1.1c1.6-1.4 3.6-2.2 5.8-2.2z" />
      <path d="M7.5 5.3c1.4 0 2.6.5 3.6 1.3l1.1-1.1C10.9 4.4 9.3 3.7 7.5 3.7S4.1 4.4 2.8 5.5l1.1 1.1c1-.8 2.2-1.3 3.6-1.3z" />
      <path d="M7.5 8.3l2-2c-.5-.4-1.2-.7-2-.7s-1.5.3-2 .7z" transform="translate(0 2)" />
    </svg>
  );
}

function IosBattery() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
      <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" strokeOpacity="0.4" />
      <rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor" />
      <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

function AndroidWifi() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      <path d="M7 11.5L.2 3.4C2 1.8 4.4.8 7 .8s5 1 6.8 2.6z" fill="currentColor" />
    </svg>
  );
}

function AndroidSignal() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M11.5.5v11H.5z" fill="currentColor" />
    </svg>
  );
}

function AndroidBattery() {
  return (
    <svg width="20" height="11" viewBox="0 0 20 11" aria-hidden="true">
      <rect x="0.5" y="0.5" width="17" height="10" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.5" />
      <rect x="2" y="2" width="11" height="7" rx="1.2" fill="currentColor" />
      <rect x="18.3" y="3.5" width="1.4" height="4" rx="0.7" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

interface StatusBarProps {
  device: Device;
  orientation: Orientation;
  width: number;
  height: number;
}

/** Status bar drawn in the strip reserved above the site (iOS or Android style). */
export function StatusBar({ device, orientation, width, height }: StatusBarProps) {
  const time = formatClock(useClock());
  if (height <= 0) return null;

  const base = "absolute inset-x-0 top-0 flex items-center bg-white text-black select-none";
  const { cutout } = device.frame;

  if (device.platform === "android") {
    const leftPad = cutout === "punch-hole-left" && orientation === "portrait" ? 42 : 18;
    return (
      <div className={`${base} justify-between pr-4 text-[13px] font-medium`} style={{ width, height, paddingLeft: leftPad }}>
        <span className="tabular-nums">{time}</span>
        <span className="flex items-center gap-1.5">
          <AndroidWifi />
          <AndroidSignal />
          <AndroidBattery />
        </span>
      </div>
    );
  }

  const icons = (
    <span className="flex items-center gap-[5px]">
      <IosSignal />
      <IosWifi />
      <IosBattery />
    </span>
  );

  if (device.platform === "ipados" || cutout === "none") {
    return (
      <div className={`${base} justify-between px-5 text-[13px] font-semibold`} style={{ width, height }}>
        <span className="tabular-nums">{time}</span>
        {icons}
      </div>
    );
  }

  if (cutout === "home-button") {
    return (
      <div className={`${base} justify-between px-1.5 text-[12px] font-semibold`} style={{ width, height }}>
        <span className="flex items-center gap-1">
          <IosSignal />
          <IosWifi />
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 tabular-nums">{time}</span>
        <IosBattery />
      </div>
    );
  }

  // Dynamic Island / notch: time and icons sit in the "ears" either side of the cutout.
  const gap = cutoutSize(device).width + 16;
  return (
    <div className={`${base} text-[16px] font-semibold`} style={{ width, height }}>
      <span className="flex flex-1 justify-center pl-4 tabular-nums">{time}</span>
      <span style={{ width: gap }} />
      <span className="flex flex-1 justify-center pr-4">{icons}</span>
    </div>
  );
}
