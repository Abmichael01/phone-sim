import type { FrameNav } from "@/shared/messages";

/**
 * Best-effort history of the framed site, rebuilt from the URLs it reports.
 * The frame's real history is out of reach (cross-origin), so this only
 * decides whether the in-phone back / forward buttons are enabled.
 */
export interface FrameHistory {
  entries: string[];
  index: number;
  /** A back/forward the simulator asked for; the next report completes it. */
  pending: "back" | "forward" | null;
}

export const EMPTY_HISTORY: FrameHistory = { entries: [], index: -1, pending: null };

export const canGoBack = (history: FrameHistory): boolean => history.index > 0;
export const canGoForward = (history: FrameHistory): boolean => history.index < history.entries.length - 1;

export function requestTraverse(history: FrameHistory, direction: "back" | "forward"): FrameHistory {
  return { ...history, pending: direction };
}

function moveTo(history: FrameHistory, index: number, href: string): FrameHistory {
  const entries = [...history.entries];
  entries[index] = href;
  return { entries, index, pending: null };
}

export function recordNavigation(history: FrameHistory, href: string, nav: FrameNav): FrameHistory {
  const { entries, index, pending } = history;
  if (pending === "back" && canGoBack(history)) return moveTo(history, index - 1, href);
  if (pending === "forward" && canGoForward(history)) return moveTo(history, index + 1, href);

  const settled: FrameHistory = { ...history, pending: null };
  if (index < 0) return { entries: [href], index: 0, pending: null };
  if (nav === "replace" || entries[index] === href) return moveTo(settled, index, href);
  if (nav === "pop") {
    if (entries[index - 1] === href) return moveTo(settled, index - 1, href);
    if (entries[index + 1] === href) return moveTo(settled, index + 1, href);
  }
  return { entries: [...entries.slice(0, index + 1), href], index: index + 1, pending: null };
}
