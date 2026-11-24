import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type TipSide = "top" | "right" | "bottom" | "left";

/** Shared Radix/shadcn-style skip-delay timer: moving directly between controls opens the next tooltip instantly. */
let lastTipClosedAt = 0;
const OPEN_DELAY_MS = 220;
const SKIP_DELAY_WINDOW_MS = 350;
const VIEWPORT_PAD = 8;
const SIDE_OFFSET = 10;

interface TipCoords {
  left: number;
  top: number;
  resolvedSide: TipSide;
  arrowOffset: number;
}

function computeCoords(trigger: DOMRect, tip: DOMRect, preferred: TipSide): TipCoords {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Flip automatically if the preferred side would clip past the viewport edge.
  let side: TipSide = preferred;
  if (preferred === "top" && trigger.top - SIDE_OFFSET - tip.height < VIEWPORT_PAD) side = "bottom";
  else if (preferred === "bottom" && trigger.bottom + SIDE_OFFSET + tip.height > vh - VIEWPORT_PAD) side = "top";
  else if (preferred === "right" && trigger.right + SIDE_OFFSET + tip.width > vw - VIEWPORT_PAD) side = "left";
  else if (preferred === "left" && trigger.left - SIDE_OFFSET - tip.width < VIEWPORT_PAD) side = "right";

  const cx = trigger.left + trigger.width / 2;
  const cy = trigger.top + trigger.height / 2;

  if (side === "top" || side === "bottom") {
    const rawLeft = cx - tip.width / 2;
    const left = Math.min(vw - tip.width - VIEWPORT_PAD, Math.max(VIEWPORT_PAD, rawLeft));
    const top = side === "top" ? trigger.top - SIDE_OFFSET - tip.height : trigger.bottom + SIDE_OFFSET;
    const arrowOffset = Math.min(tip.width - 12, Math.max(12, cx - left));
    return { left, top, resolvedSide: side, arrowOffset };
  }

  const rawTop = cy - tip.height / 2;
  const top = Math.min(vh - tip.height - VIEWPORT_PAD, Math.max(VIEWPORT_PAD, rawTop));
  const left = side === "right" ? trigger.right + SIDE_OFFSET : trigger.left - SIDE_OFFSET - tip.width;
  const arrowOffset = Math.min(tip.height - 10, Math.max(10, cy - top));
  return { left, top, resolvedSide: side, arrowOffset };
}

/**
 * Sleek shadcn/ui-style inverted pill tooltip with rotated diamond arrow,
 * portal rendering (never clipped by drawers or scaled frames), viewport clamping,
 * and shared skip-delay across adjacent controls. Zero drop shadows.
 */
export function Tip({
  label,
  keys,
  side = "top",
  disabled = false,
  className = "inline-flex",
  children,
}: {
  label: string;
  keys?: string;
  side?: TipSide;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number>(0);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TipCoords | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    if (openRef.current) lastTipClosedAt = performance.now();
    openRef.current = false;
    setOpen(false);
  }, [clearTimer]);

  const show = useCallback(
    (immediate = false) => {
      if (disabled || !label) return;
      clearTimer();
      const warm = performance.now() - lastTipClosedAt < SKIP_DELAY_WINDOW_MS;
      if (immediate || warm) {
        openRef.current = true;
        setOpen(true);
        return;
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = 0;
        openRef.current = true;
        setOpen(true);
      }, OPEN_DELAY_MS);
    },
    [disabled, label, clearTimer],
  );

  useEffect(() => {
    if (disabled) hide();
  }, [disabled, hide]);

  useEffect(() => clearTimer, [clearTimer]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const update = (): void => {
      const triggerEl = triggerRef.current;
      const tipEl = tipRef.current;
      if (!triggerEl || !tipEl) return;
      setCoords(computeCoords(triggerEl.getBoundingClientRect(), tipEl.getBoundingClientRect(), side));
    };
    update();
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, side, label, keys, hide]);

  const resolvedSide = coords?.resolvedSide ?? side;
  const slideOffset: CSSProperties =
    resolvedSide === "right"
      ? ({ "--tip-dx": "-4px", "--tip-dy": "0px" } as CSSProperties)
      : resolvedSide === "left"
        ? ({ "--tip-dx": "4px", "--tip-dy": "0px" } as CSSProperties)
        : resolvedSide === "bottom"
          ? ({ "--tip-dx": "0px", "--tip-dy": "-4px" } as CSSProperties)
          : ({ "--tip-dx": "0px", "--tip-dy": "4px" } as CSSProperties);

  const arrowStyle: CSSProperties =
    resolvedSide === "top"
      ? { left: coords?.arrowOffset ?? "50%", bottom: -3.5, transform: "translateX(-50%) rotate(45deg)" }
      : resolvedSide === "bottom"
        ? { left: coords?.arrowOffset ?? "50%", top: -3.5, transform: "translateX(-50%) rotate(45deg)" }
        : resolvedSide === "right"
          ? { top: coords?.arrowOffset ?? "50%", left: -3.5, transform: "translateY(-50%) rotate(45deg)" }
          : { top: coords?.arrowOffset ?? "50%", right: -3.5, transform: "translateY(-50%) rotate(45deg)" };

  return (
    <>
      <span
        ref={triggerRef}
        className={className}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") show(false);
        }}
        onPointerLeave={hide}
        onPointerDown={hide}
        onFocus={(event) => {
          if (event.target instanceof Element && event.target.matches(":focus-visible")) show(true);
        }}
        onBlur={hide}
      >
        {children}
      </span>
      {open &&
        !disabled &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className="phone-sim-tip pointer-events-none fixed z-[100] flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[11.5px] font-medium leading-none text-stage"
            style={{
              left: coords?.left ?? -9999,
              top: coords?.top ?? -9999,
              visibility: coords ? "visible" : "hidden",
              ...slideOffset,
            }}
          >
            <span>{label}</span>
            {keys && (
              <kbd className="rounded-full bg-stage/14 px-1.5 py-0.5 font-sans text-[10px] font-semibold leading-none text-stage/80">
                {keys}
              </kbd>
            )}
            <span aria-hidden="true" className="pointer-events-none absolute size-[7px] rounded-[1.5px] bg-ink" style={arrowStyle} />
          </span>,
          document.body,
        )}
    </>
  );
}

interface RailButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  keys?: string;
  active?: boolean;
  accent?: boolean;
  hideTip?: boolean;
  badge?: string | number;
}

/** 40×40 flat circular button inside the 57px left dock rail (equal 8px rail padding around it). */
export function RailButton({
  label,
  keys,
  active = false,
  accent = false,
  hideTip = false,
  badge,
  className = "",
  children,
  ...props
}: RailButtonProps) {
  const tone = accent
    ? "bg-accent text-accent-ink hover:brightness-110"
    : active
      ? "bg-raised text-ink"
      : "text-ink/85 hover:bg-raised hover:text-ink";
  return (
    <Tip label={label} keys={keys} side="right" disabled={hideTip}>
      <button
        type="button"
        aria-label={label}
        className={`relative grid size-10 place-items-center rounded-full transition-colors duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-35 ${tone} ${className}`}
        {...props}
      >
        {children}
        {badge !== undefined && (
          <span className="pointer-events-none absolute right-0.5 top-0.5 grid min-w-[15px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-bold leading-[15px] text-accent-ink tabular-nums">
            {badge}
          </span>
        )}
      </button>
    </Tip>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-raised p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-7 flex-1 rounded-full px-2.5 text-xs font-medium tabular-nums transition-colors ${
            value === option.value ? "bg-panel text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange(checked: boolean): void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-full px-2 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-raised/50"
    >
      {label}
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-raised"}`}>
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

/** Flat slide-out drawer anchored beside the left rail (clean border, zero drop shadow). */
export function Drawer({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className={`phone-sim-drawer fixed left-[65px] z-40 rounded-3xl border border-line bg-panel text-ink ${className}`}
    >
      {children}
    </div>
  );
}
