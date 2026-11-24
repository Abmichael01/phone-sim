import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/** Pixels of slack before an edge counts as "more to scroll". */
const EDGE_SLACK = 2;
/** One click scrolls this share of the visible width. */
const PAGE_SHARE = 0.7;

interface ScrollRowProps {
  children: ReactNode;
  /** Accessible name for the row, e.g. "Device filters". */
  label: string;
  /** Classes for the inner flex row (gap, padding…). */
  className?: string;
  /** Changes when the selection changes, so the selected item is scrolled into view. */
  selectionKey?: string;
}

/**
 * A horizontal row that scrolls sideways with arrow buttons. The ‹ / › buttons
 * and the edge fade only show on a side that has more content; the mouse wheel
 * scrolls the row sideways; the item marked `aria-pressed="true"` or
 * `aria-selected="true"` is kept in view when `selectionKey` changes.
 */
export function ScrollRow({ children, label, className = "", selectionKey }: ScrollRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const left = row.scrollLeft > EDGE_SLACK;
    const right = row.scrollLeft + row.clientWidth < row.scrollWidth - EDGE_SLACK;
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(row);
    for (const child of Array.from(row.children)) resize.observe(child);
    row.addEventListener("scroll", measure, { passive: true });

    // Vertical wheel → sideways scroll, only while the row can actually move.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = row.scrollWidth - row.clientWidth;
      if (max <= 0) return;
      const next = Math.min(max, Math.max(0, row.scrollLeft + event.deltaY));
      if (next === row.scrollLeft) return;
      event.preventDefault();
      row.scrollLeft = next;
    };
    row.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      resize.disconnect();
      row.removeEventListener("scroll", measure);
      row.removeEventListener("wheel", onWheel);
    };
  }, [measure, children]);

  useEffect(() => {
    const selected = rowRef.current?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"]');
    selected?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectionKey]);

  const page = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * row.clientWidth * PAGE_SHARE, behavior: "smooth" });
  };

  const fade = `${edges.left ? "transparent 0, #000 36px" : "#000 0"}, ${edges.right ? "#000 calc(100% - 36px), transparent 100%" : "#000 100%"}`;

  return (
    <div className="relative" role="group" aria-label={label}>
      <div
        ref={rowRef}
        className={`no-scrollbar flex overflow-x-auto scroll-smooth ${className}`}
        style={{ maskImage: `linear-gradient(to right, ${fade})`, WebkitMaskImage: `linear-gradient(to right, ${fade})` }}
      >
        {children}
      </div>
      <ScrollArrow side="left" visible={edges.left} onClick={() => page(-1)} />
      <ScrollArrow side="right" visible={edges.right} onClick={() => page(1)} />
    </div>
  );
}

function ScrollArrow({ side, visible, onClick }: { side: "left" | "right"; visible: boolean; onClick: () => void }) {
  const Glyph = side === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={`absolute top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-line bg-glass text-ink shadow-md shadow-black/30 transition-[opacity,transform] duration-150 hover:scale-110 hover:bg-accent hover:text-accent-ink active:scale-95 ${
        side === "left" ? "left-0.5" : "right-0.5"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Glyph width={14} height={14} strokeWidth={2.2} />
    </button>
  );
}
