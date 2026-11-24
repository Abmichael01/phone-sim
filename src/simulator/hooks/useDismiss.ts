import { useEffect, type RefObject } from "react";

/** Calls `onDismiss` on Escape or a pointer press outside every element in `refs`, while `open`. */
export function useDismiss(open: boolean, refs: readonly RefObject<HTMLElement | null>[], onDismiss: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Node && refs.some((ref) => ref.current?.contains(target))) return;
      onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, refs, onDismiss]);
}
