import type { Tone } from "./frame/tone";
import { GlobeIcon } from "./icons";

const SCREEN: Record<Tone, { bg: string; card: string; text: string; muted: string; accent: string }> = {
  light: { bg: "#f2f3f6", card: "#ffffff", text: "#1b1f29", muted: "#5d6475", accent: "#2563eb" },
  dark: { bg: "#101114", card: "#1d1f24", text: "#eceef2", muted: "#9aa1ad", accent: "#2563eb" },
};

/** Shown inside the screen when there is no page to load yet. */
export function EmptyState({ tone }: { tone: Tone }) {
  const colors = SCREEN[tone];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center" style={{ background: colors.bg, color: colors.text }}>
      <span className="grid size-12 place-items-center rounded-2xl border border-black/10" style={{ background: colors.card, color: colors.accent }}>
        <GlobeIcon width={24} height={24} />
      </span>
      <p className="text-[15px] font-semibold">Type a web address</p>
      <p className="max-w-64 text-[13px] leading-snug" style={{ color: colors.muted }}>
        Click the address icon on the left rail (or press Ctrl L). Browser pages such as chrome:// or opera:// can't be shown inside a frame.
      </p>
    </div>
  );
}

/** Shown while the background switches this tab's headers to the selected device. */
export function PreparingState({ tone }: { tone: Tone }) {
  return (
    <div className="flex h-full items-center justify-center" style={{ background: SCREEN[tone].bg }}>
      <span className="size-6 animate-spin rounded-full border-2 border-[#8891a3]/40 border-t-[#5b8cff]" aria-label="Preparing device" />
    </div>
  );
}

interface UnreachableNoticeProps {
  onRetry(): void;
  onOpenInTab(): void;
  onDismiss(): void;
}

/** Card over the bottom of the screen when the frame loaded but the site never reported in. */
export function UnreachableNotice({ onRetry, onOpenInTab, onDismiss }: UnreachableNoticeProps) {
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-black/10 bg-white/95 p-4 text-[#1b1f29] backdrop-blur" role="alert">
      <p className="text-[14px] font-semibold">This page didn't load in the frame</p>
      <p className="mt-1 text-[12.5px] leading-snug text-[#5d6475]">
        The address may be wrong, the site may be offline, or it blocks being shown inside other pages in a way headers can't fix. Sites that need a login may also need third-party cookies allowed.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[12.5px] font-medium">
        <button type="button" onClick={onRetry} className="rounded-lg bg-[#2f6bff] px-3 py-1.5 text-white hover:bg-[#2558d6]">
          Retry
        </button>
        <button type="button" onClick={onOpenInTab} className="rounded-lg bg-[#eceef3] px-3 py-1.5 hover:bg-[#e1e4eb]">
          Open in new tab
        </button>
        <button type="button" onClick={onDismiss} className="rounded-lg px-3 py-1.5 text-[#5d6475] hover:bg-[#eceef3]">
          Dismiss
        </button>
      </div>
    </div>
  );
}
