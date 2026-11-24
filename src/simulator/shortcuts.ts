/** Keyboard shortcuts of the simulator page (pure mapping, so it can be tested). */

export type ShortcutAction =
  | "devices"
  | "add-device"
  | "backgrounds"
  | "rotate"
  | "sync-scroll"
  | "prev-device"
  | "next-device"
  | "screenshot"
  | "screenshot-screen"
  | "record"
  | "zoom-fit"
  | "zoom-100"
  | "zoom-75"
  | "zoom-50"
  | "edit-url"
  | "back"
  | "forward";

export interface KeyLike {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

const PLAIN_KEYS: Record<string, ShortcutAction> = {
  KeyD: "devices",
  KeyA: "add-device",
  KeyB: "backgrounds",
  KeyR: "rotate",
  KeyY: "sync-scroll",
  BracketLeft: "prev-device",
  BracketRight: "next-device",
  KeyS: "screenshot",
  KeyV: "record",
  KeyF: "zoom-fit",
  Digit1: "zoom-100",
  Digit2: "zoom-75",
  Digit3: "zoom-50",
};

export function shortcutFor(event: KeyLike): ShortcutAction | null {
  const command = event.ctrlKey || event.metaKey;
  if (command && !event.altKey && event.key.toLowerCase() === "l") return "edit-url";
  if (event.altKey && !command) {
    if (event.key === "ArrowLeft") return "back";
    if (event.key === "ArrowRight") return "forward";
    return null;
  }
  if (command || event.altKey) return null;
  if (event.code === "KeyS" && event.shiftKey) return "screenshot-screen";
  if (event.shiftKey) return null;
  return PLAIN_KEYS[event.code] ?? null;
}

/** Shortcut labels for tooltips and the list in Settings. */
export const SHORTCUT_KEYS: Record<ShortcutAction, string> = {
  devices: "D",
  "add-device": "A",
  backgrounds: "B",
  rotate: "R",
  "sync-scroll": "Y",
  "prev-device": "[",
  "next-device": "]",
  screenshot: "S",
  "screenshot-screen": "⇧S",
  record: "V",
  "zoom-fit": "F",
  "zoom-100": "1",
  "zoom-75": "2",
  "zoom-50": "3",
  "edit-url": "Ctrl L",
  back: "Alt ←",
  forward: "Alt →",
};

export const SHORTCUT_LIST: readonly { action: ShortcutAction; label: string }[] = [
  { action: "devices", label: "Devices & layout" },
  { action: "add-device", label: "Add device to stage" },
  { action: "backgrounds", label: "Stage backgrounds" },
  { action: "rotate", label: "Rotate active" },
  { action: "sync-scroll", label: "Toggle sync scroll" },
  { action: "prev-device", label: "Previous device" },
  { action: "next-device", label: "Next device" },
  { action: "screenshot", label: "Instant screenshot" },
  { action: "screenshot-screen", label: "Screenshot, screen only" },
  { action: "record", label: "Record / stop" },
  { action: "zoom-fit", label: "Zoom to fit" },
  { action: "zoom-100", label: "Zoom 100%" },
  { action: "zoom-75", label: "Zoom 75%" },
  { action: "zoom-50", label: "Zoom 50%" },
  { action: "edit-url", label: "Edit address" },
  { action: "back", label: "Back" },
  { action: "forward", label: "Forward" },
];
