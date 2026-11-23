import { GlobeIcon } from "./icons";

/** Shown inside the screen when there is no page to load yet. */
export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f4f5f8] px-8 text-center text-[#1b1f29]">
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#4a5bd4] shadow-sm">
        <GlobeIcon width={24} height={24} />
      </span>
      <p className="text-[15px] font-semibold">Type a web address above</p>
      <p className="max-w-64 text-[13px] leading-snug text-[#5d6475]">
        It opens here as this device sees it. Browser pages such as chrome:// or opera:// can't be shown inside a frame.
      </p>
    </div>
  );
}

/** Shown while the background switches this tab's headers to the selected device. */
export function PreparingState() {
  return (
    <div className="flex h-full items-center justify-center bg-[#f4f5f8]">
      <span className="size-6 animate-spin rounded-full border-2 border-[#c9cedb] border-t-[#4a5bd4]" aria-label="Preparing device" />
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
    <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 p-4 text-[#1b1f29] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur" role="alert">
      <p className="text-[14px] font-semibold">This page didn't load in the frame</p>
      <p className="mt-1 text-[12.5px] leading-snug text-[#5d6475]">
        The address may be wrong, the site may be offline, or it blocks being shown inside other pages in a way headers can't fix.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[12.5px] font-medium">
        <button type="button" onClick={onRetry} className="rounded-lg bg-[#4a5bd4] px-3 py-1.5 text-white hover:bg-[#3d4dc0]">
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
