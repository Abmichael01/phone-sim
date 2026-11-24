import { useEffect, useRef } from "react";
import { shortcutFor, type ShortcutAction } from "../shortcuts";

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** Page-wide keyboard shortcuts, ignored while typing (Ctrl/Cmd+L works everywhere). */
export function useShortcuts(handlers: Record<ShortcutAction, () => void>, enabled: boolean): void {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      const action = shortcutFor(event);
      if (!action || (action !== "edit-url" && isTyping(event.target))) return;
      event.preventDefault();
      latest.current[action]();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
