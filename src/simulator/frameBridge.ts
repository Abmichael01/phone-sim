import { PARENT_MESSAGE_SOURCE, type ParentMessage } from "@/shared/messages";
import { useSimulatorStore } from "@/stores/simulator";

/**
 * Registry of every live site iframe on the multi-device stage, keyed by slotId.
 * Lets rail controls, in-phone browser bars, shortcuts, sync-scroll and auto-scroll
 * recording talk to the right iframe(s) without prop drilling.
 */
const frames = new Map<string, HTMLIFrameElement>();

let autoScrollDoneListener: ((slotId: string) => void) | null = null;

export function registerFrame(slotId: string, frame: HTMLIFrameElement): void {
  frames.set(slotId, frame);
}

export function unregisterFrame(slotId: string, frame: HTMLIFrameElement | null): void {
  if (frames.get(slotId) === frame) frames.delete(slotId);
}

export function isSlotFrameWindow(slotId: string, source: MessageEventSource | null): boolean {
  const frame = frames.get(slotId);
  return frame !== undefined && source === frame.contentWindow;
}

/** The frame's origin changes as the site navigates, and the commands carry no sensitive data, so "*" is used. */
function postTo(slotId: string, message: ParentMessage): void {
  frames.get(slotId)?.contentWindow?.postMessage(message, "*");
}

export function goBack(slotId?: string): void {
  const store = useSimulatorStore.getState();
  const target = slotId ?? store.activeSlotId;
  if (store.requestTraverse(target, "back")) postTo(target, { source: PARENT_MESSAGE_SOURCE, cmd: "back" });
}

export function goForward(slotId?: string): void {
  const store = useSimulatorStore.getState();
  const target = slotId ?? store.activeSlotId;
  if (store.requestTraverse(target, "forward")) postTo(target, { source: PARENT_MESSAGE_SOURCE, cmd: "forward" });
}

export function sendFrameConfig(slotId: string, touchCursor: boolean, syncScroll: boolean): void {
  postTo(slotId, { source: PARENT_MESSAGE_SOURCE, cmd: "config", touchCursor, syncScroll });
}

/** Propagates a scroll ratio from one device frame to all sibling frames on stage. */
export function broadcastScroll(fromSlotId: string, ratioX: number, ratioY: number): void {
  const message: ParentMessage = { source: PARENT_MESSAGE_SOURCE, cmd: "scroll", ratioX, ratioY };
  for (const [slotId, frame] of frames) {
    if (slotId !== fromSlotId) frame.contentWindow?.postMessage(message, "*");
  }
}

/** Soft-syncs an SPA route change into a sibling frame without reloading the iframe document. */
export function sendSpaNav(slotId: string, href: string, replace = false): void {
  postTo(slotId, { source: PARENT_MESSAGE_SOURCE, cmd: "spa-nav", href, replace });
}

export interface AutoScrollOptions {
  speed: number;
  fromTop: boolean;
  delayMs: number;
  stopAtBottom: boolean;
}

export function startAutoScroll(slotId: string, options: AutoScrollOptions): void {
  postTo(slotId, { source: PARENT_MESSAGE_SOURCE, cmd: "auto-scroll-start", ...options });
}

export function stopAutoScroll(slotId: string): void {
  postTo(slotId, { source: PARENT_MESSAGE_SOURCE, cmd: "auto-scroll-stop" });
}

export function setAutoScrollDoneListener(listener: ((slotId: string) => void) | null): void {
  autoScrollDoneListener = listener;
}

export function notifyAutoScrollDone(slotId: string): void {
  autoScrollDoneListener?.(slotId);
}
