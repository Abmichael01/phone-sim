import type { ReactNode } from "react";
import type { Device } from "@/schemas/device";
import type { Orientation } from "@/schemas/settings";
import { canGoBack, canGoForward } from "@/stores/frameHistory";
import { useSimulatorStore } from "@/stores/simulator";
import { goBack, goForward } from "../../frameBridge";
import {
  BookIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  KebabIcon,
  LockIcon,
  MoreIcon,
  PlusIcon,
  ReloadIcon,
  ShareIcon,
  TabsIcon,
} from "../icons";
import { SHORTCUT_KEYS } from "../../shortcuts";
import { Tip, type TipSide } from "../ui";
import { barColors, type BarColors, type Tone } from "./tone";

interface BarProps {
  slotId: string;
  device: Device;
  orientation: Orientation;
  tone: Tone;
  height: number;
}

function parseUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function useBrowserState(slotId: string) {
  const rt = useSimulatorStore((state) => state.slotRuntime[slotId]);
  const fallbackUrl = useSimulatorStore((state) => state.url);
  const current = rt?.frameHref ?? rt?.url ?? fallbackUrl;
  const parsed = parseUrl(current);
  const domain = parsed ? parsed.host.replace(/^www\./, "") : "";
  const secure = parsed?.protocol === "https:";
  const history = rt?.frameHistory;
  return {
    current,
    domain,
    secure,
    back: history ? canGoBack(history) : false,
    forward: history ? canGoForward(history) : false,
  };
}

const editAddress = (): void => useSimulatorStore.getState().setPanel("url");

function BarButton({
  label,
  onClick,
  disabled = false,
  color,
  tipSide = "bottom",
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  color: string;
  tipSide?: TipSide;
  children: ReactNode;
}) {
  if (!onClick) {
    return (
      <span className="grid size-9 place-items-center" style={{ color }} aria-hidden="true">
        {children}
      </span>
    );
  }
  return (
    <Tip label={label} side={tipSide} disabled={disabled}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className="grid size-9 place-items-center rounded-full transition-opacity hover:opacity-70 disabled:opacity-35"
        style={{ color }}
      >
        {children}
      </button>
    </Tip>
  );
}

/** Rounded address field showing only the domain; clicking it edits the address. */
function AddressField({
  slotId,
  colors,
  height,
  align,
  children,
}: {
  slotId: string;
  colors: BarColors;
  height: number;
  align: "center" | "start";
  children?: ReactNode;
}) {
  const { domain, secure } = useBrowserState(slotId);
  return (
    <div className="flex min-w-0 flex-1 items-center rounded-[11px]" style={{ height, background: colors.field }}>
      {align === "center" && children && <span className="size-9 shrink-0" aria-hidden="true" />}
      <Tip label="Edit address" keys={SHORTCUT_KEYS["edit-url"]} side="bottom" className="flex h-full min-w-0 flex-1">
        <button
          type="button"
          onClick={editAddress}
          className={`flex h-full min-w-0 flex-1 items-center gap-1.5 px-3 text-[14.5px] ${align === "center" ? "justify-center" : "justify-start"}`}
          style={{ color: colors.text }}
        >
          {domain && secure && <LockIcon width={12} height={12} style={{ color: colors.muted }} />}
          <span className="truncate">{domain || "Search or enter website"}</span>
        </button>
      </Tip>
      {children}
    </div>
  );
}

function SafariTop({ slotId, colors, landscape, landscapeInset }: { slotId: string; colors: BarColors; landscape: boolean; landscapeInset: number }) {
  const { current, back, forward } = useBrowserState(slotId);
  const reload = (
    <BarButton label="Reload" onClick={current ? () => useSimulatorStore.getState().reload(slotId) : undefined} color={colors.muted}>
      <ReloadIcon width={15} height={15} />
    </BarButton>
  );
  if (!landscape) {
    return (
      <div className="flex h-full items-center px-2.5 pb-1">
        <AddressField slotId={slotId} colors={colors} height={36} align="center">
          {reload}
        </AddressField>
      </div>
    );
  }
  return (
    <div className="flex h-full items-center gap-1" style={{ paddingInline: landscapeInset }}>
      <BarButton label="Back" onClick={() => goBack(slotId)} disabled={!back} color={colors.accent}>
        <ChevronLeftIcon width={20} height={20} />
      </BarButton>
      <BarButton label="Forward" onClick={() => goForward(slotId)} disabled={!forward} color={colors.accent}>
        <ChevronRightIcon width={20} height={20} />
      </BarButton>
      <AddressField slotId={slotId} colors={colors} height={28} align="center">
        {reload}
      </AddressField>
      <BarButton label="Tabs" color={colors.accent}>
        <TabsIcon width={20} height={20} />
      </BarButton>
    </div>
  );
}

function SafariToolbar({ slotId, colors, homeIndicator }: { slotId: string; colors: BarColors; homeIndicator: boolean }) {
  const { back, forward } = useBrowserState(slotId);
  return (
    <div className="relative h-full">
      <div className="flex h-[46px] items-center justify-around px-3">
        <BarButton label="Back" tipSide="top" onClick={() => goBack(slotId)} disabled={!back} color={colors.accent}>
          <ChevronLeftIcon width={23} height={23} />
        </BarButton>
        <BarButton label="Forward" tipSide="top" onClick={() => goForward(slotId)} disabled={!forward} color={colors.accent}>
          <ChevronRightIcon width={23} height={23} />
        </BarButton>
        <BarButton label="Share" color={colors.accent}>
          <ShareIcon width={21} height={21} />
        </BarButton>
        <BarButton label="Tabs" color={colors.accent}>
          <TabsIcon width={22} height={22} />
        </BarButton>
        <BarButton label="More" color={colors.accent}>
          <MoreIcon width={22} height={22} />
        </BarButton>
      </div>
      {homeIndicator && <HomeIndicator color={colors.text} />}
    </div>
  );
}

function SafariTabletBar({ slotId, colors }: { slotId: string; colors: BarColors }) {
  const { current, back, forward } = useBrowserState(slotId);
  return (
    <div className="flex h-full items-center gap-1 px-4">
      <BarButton label="Back" onClick={() => goBack(slotId)} disabled={!back} color={colors.accent}>
        <ChevronLeftIcon width={22} height={22} />
      </BarButton>
      <BarButton label="Forward" onClick={() => goForward(slotId)} disabled={!forward} color={colors.accent}>
        <ChevronRightIcon width={22} height={22} />
      </BarButton>
      <BarButton label="Bookmarks" color={colors.accent}>
        <BookIcon width={20} height={20} />
      </BarButton>
      <div className="mx-auto flex w-[46%] min-w-48">
        <AddressField slotId={slotId} colors={colors} height={34} align="center">
          <BarButton label="Reload" onClick={current ? () => useSimulatorStore.getState().reload(slotId) : undefined} color={colors.muted}>
            <ReloadIcon width={15} height={15} />
          </BarButton>
        </AddressField>
      </div>
      <BarButton label="Share" color={colors.accent}>
        <ShareIcon width={20} height={20} />
      </BarButton>
      <BarButton label="New tab" color={colors.accent}>
        <PlusIcon width={21} height={21} />
      </BarButton>
      <BarButton label="Tabs" color={colors.accent}>
        <TabsIcon width={21} height={21} />
      </BarButton>
    </div>
  );
}

function ChromeToolbar({ slotId, colors, compact, landscapeInset }: { slotId: string; colors: BarColors; compact: boolean; landscapeInset: number }) {
  const { current } = useBrowserState(slotId);
  const parsed = parseUrl(current);
  const home = parsed ? () => useSimulatorStore.getState().navigate(parsed.origin + "/") : undefined;
  return (
    <div className="flex h-full items-center gap-1" style={{ paddingInline: compact ? landscapeInset : 8 }}>
      <BarButton label="Home" onClick={home} color={colors.muted}>
        <HomeIcon width={21} height={21} />
      </BarButton>
      <div className="flex min-w-0 flex-1">
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: colors.field }}>
          <AddressField slotId={slotId} colors={{ ...colors, field: "transparent" }} height={compact ? 30 : 40} align="start" />
        </div>
      </div>
      <BarButton label="Tabs" color={colors.muted}>
        <TabsIcon width={21} height={21} />
      </BarButton>
      <BarButton label="Menu" color={colors.muted}>
        <KebabIcon width={21} height={21} />
      </BarButton>
    </div>
  );
}

function HomeIndicator({ color }: { color: string }) {
  return <span className="absolute bottom-[8px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full opacity-90" style={{ background: color }} />;
}

export function BrowserTopBar({ slotId, device, orientation, tone, height }: BarProps) {
  if (height <= 0) return null;
  const colors = barColors(device.platform, tone);
  const landscapePhone = orientation === "landscape" && device.kind !== "tablet";
  const landscapeInset = Math.max(12, Math.round(device.frame.screenRadius * 0.55));
  let content: ReactNode;
  if (device.platform === "android") content = <ChromeToolbar slotId={slotId} colors={colors} compact={landscapePhone} landscapeInset={landscapeInset} />;
  else if (device.platform === "ipados") content = <SafariTabletBar slotId={slotId} colors={colors} />;
  else content = <SafariTop slotId={slotId} colors={colors} landscape={landscapePhone} landscapeInset={landscapeInset} />;
  return (
    <div
      className="h-full w-full select-none"
      style={{ background: colors.bar, borderBottom: `1px solid ${tone === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}` }}
    >
      {content}
    </div>
  );
}

export function BrowserBottomBar({ slotId, device, tone, height }: BarProps) {
  if (height <= 0) return null;
  const colors = barColors(device.platform, tone);
  return (
    <div
      className="relative h-full w-full select-none"
      style={{ background: colors.bar, borderTop: `1px solid ${tone === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}` }}
    >
      {device.platform === "android" ? (
        <span className="absolute left-1/2 top-1/2 h-[4px] w-[108px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80" style={{ background: colors.text }} />
      ) : (
        <SafariToolbar slotId={slotId} colors={colors} homeIndicator={device.frame.cutout !== "home-button"} />
      )}
    </div>
  );
}
