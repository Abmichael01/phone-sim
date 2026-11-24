import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { DEFAULT_DEVICE_ID, findDevice, resolveDevice, withFinish } from "@/devices";
import { frameLayout, multiStageSize, STAGE_GAP, stepZoom, zoomScale, type FrameLayout } from "@/devices/layout";
import type { Device } from "@/schemas/device";
import type { DeviceSlot, Zoom } from "@/schemas/settings";
import { useSimulatorStore } from "@/stores/simulator";
import { resolveStageBackgroundStyle } from "../backgrounds";
import { setSlotCaptureElement, type CaptureRegistry } from "../hooks/useScreenshot";
import { useElementSize } from "../hooks/useElementSize";
import { BrowserBottomBar, BrowserTopBar } from "./frame/BrowserBars";
import { DeviceFrame } from "./frame/DeviceFrame";
import type { Tone } from "./frame/tone";
import { ChevronDownIcon, CloseIcon, ExpandIcon, RotateIcon } from "./icons";
import { DeviceScreen } from "./DeviceScreen";
import { Tip } from "./ui";

/** Full-height stage next to the slim left rail: minimal vertical overhead so Fit fills the screen. */
const TOP_PADDING = 14;
const SIDE_PADDING = 24;
const BOTTOM_PADDING = 10;
const CAPTION_HEIGHT = 34;
/** Studio margin around the phone when recording in "Phone + BG" (including Chroma Green) mode. */
const RECORD_BG_PADDING = 36;
const WHEEL_STEP_MS = 140;

const ZOOM_CYCLE: readonly Zoom[] = ["fit", "100", "75", "50"];

function cycleZoom(): void {
  const store = useSimulatorStore.getState();
  const next = ZOOM_CYCLE[(ZOOM_CYCLE.indexOf(store.zoom) + 1) % ZOOM_CYCLE.length] ?? "fit";
  store.setPreference("zoom", next);
}

interface DeviceCardProps {
  slot: DeviceSlot;
  device: Device;
  layout: FrameLayout;
  scale: number;
  barTone: Tone;
  demoStatusBar: boolean;
  active: boolean;
  multi: boolean;
  solo: boolean;
  hiddenOffscreen: boolean;
  bgPad: number;
  hasBackdrop: boolean;
  registry: CaptureRegistry;
}

/** One device on the multi-device canvas with rotation/switch animations and sleek inline caption. */
function StageDevice({
  slot,
  device,
  layout,
  scale,
  barTone,
  demoStatusBar,
  active,
  multi,
  solo,
  hiddenOffscreen,
  bgPad,
  hasBackdrop,
  registry,
}: DeviceCardProps) {
  const spinRef = useRef<HTMLDivElement>(null);
  const capturing = useSimulatorStore((state) => state.capturing);
  const locked = useSimulatorStore((state) => state.recording.status !== "idle");

  // Rotation animation when this slot flips orientation.
  const previousOrientation = useRef(slot.orientation);
  useLayoutEffect(() => {
    if (previousOrientation.current === slot.orientation) return;
    previousOrientation.current = slot.orientation;
    const from = slot.orientation === "landscape" ? 90 : -90;
    spinRef.current?.animate([{ transform: `rotate(${from}deg) scale(0.94)` }, { transform: "rotate(0deg) scale(1)" }], {
      duration: 260,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
  }, [slot.orientation]);

  // Device swap cross-fade for this slot.
  const previousDevice = useRef(device.id);
  useLayoutEffect(() => {
    if (previousDevice.current === device.id) return;
    previousDevice.current = device.id;
    spinRef.current?.animate([{ opacity: 0, transform: "scale(0.98)" }, { opacity: 1, transform: "scale(1)" }], {
      duration: 200,
      easing: "ease-out",
    });
  }, [device.id]);

  const focusSlot = (): void => {
    if (!active) useSimulatorStore.getState().setActiveSlot(slot.slotId);
  };

  const openSwap = (): void => {
    const store = useSimulatorStore.getState();
    store.setActiveSlot(slot.slotId);
    store.setPanel("devices");
  };

  const scaledW = layout.outer.width * scale;
  const scaledH = layout.outer.height * scale;
  const scaledBodyRadius = layout.bodyRadius * scale;

  const hideChrome = capturing !== null || locked;

  return (
    <div
      data-slot-id={slot.slotId}
      data-active={active ? "true" : "false"}
      data-hidden={hiddenOffscreen ? "true" : "false"}
      className="group/device flex flex-col items-center"
      style={hiddenOffscreen ? { position: "fixed", left: -99999, top: 0, visibility: "hidden", pointerEvents: "none" } : undefined}
      onPointerDown={focusSlot}
    >
      {/* Un-transformed studio padded wrapper: crops cleanly to phone + background (or Chroma Green) in Phone + BG mode. */}
      <div
        ref={(el) => setSlotCaptureElement(registry, slot.slotId, "frameWithBg", el)}
        style={{ padding: bgPad }}
      >
        {/* Outer un-transformed box sized to the scaled device: ideal Region Capture target (phone only). */}
        <div
          ref={(el) => setSlotCaptureElement(registry, slot.slotId, "frameBox", el)}
          style={{ width: scaledW, height: scaledH }}
        >
          <div style={{ width: layout.outer.width, height: layout.outer.height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <div ref={spinRef} style={{ width: layout.outer.width, height: layout.outer.height }}>
              <DeviceFrame
                device={device}
                layout={layout}
                tone={barTone}
                demoStatusBar={demoStatusBar}
                capturing={active || capturing === "all" ? capturing : null}
                bodyRef={(el) => setSlotCaptureElement(registry, slot.slotId, "body", el, scaledBodyRadius)}
                screenRef={(el) => setSlotCaptureElement(registry, slot.slotId, "screen", el)}
                viewportRef={(el) => setSlotCaptureElement(registry, slot.slotId, "viewport", el)}
                topBar={<BrowserTopBar slotId={slot.slotId} device={device} orientation={slot.orientation} tone={barTone} height={layout.bars.top} />}
                bottomBar={<BrowserBottomBar slotId={slot.slotId} device={device} orientation={slot.orientation} tone={barTone} height={layout.bars.bottom} />}
              >
                <DeviceScreen slotId={slot.slotId} device={device} tone={barTone} />
              </DeviceFrame>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek compact caption pill (hidden during screenshot & video recording). */}
      {!hideChrome && (
        <div className="flex items-end justify-center" style={{ height: CAPTION_HEIGHT }}>
        <div
          onDoubleClick={() => {
            if (multi && !locked) useSimulatorStore.getState().toggleSoloSlot(slot.slotId);
          }}
          className={`flex items-center gap-1 rounded-full p-1 text-[11.5px] leading-none transition-colors ${
            hasBackdrop ? "border border-glass-line bg-glass/92" : ""
          }`}
        >
          <Tip label={multi ? "Switch device · Double-click to solo" : "Switch device"} side="top">
            <button
              type="button"
              onClick={openSwap}
              className={`flex h-6 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-raised hover:text-ink ${
                active ? "text-ink" : "text-muted"
              }`}
            >
              {multi && <span className={`size-1.5 shrink-0 rounded-full ${active ? "bg-accent" : "bg-muted/35"}`} aria-hidden="true" />}
              <span className="font-medium">{device.name}</span>
              {device.approx && (
                <span className="rounded-full bg-raised px-1.5 text-[10px] text-muted">
                  ≈
                </span>
              )}
              <span className="text-muted tabular-nums">· {layout.viewport.width}×{layout.viewport.height}</span>
              <ChevronDownIcon width={11} height={11} className="text-muted" />
            </button>
          </Tip>

          <Tip label="Cycle zoom (Fit · 100% · 75% · 50%)" side="top">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                cycleZoom();
              }}
              className="h-6 rounded-full px-2 text-[11px] font-medium text-muted tabular-nums transition-colors hover:bg-raised hover:text-ink"
            >
              {Math.round(scale * 100)}%
            </button>
          </Tip>

          {!locked && (
            <span className={`flex items-center gap-0.5 transition-opacity ${active || solo ? "opacity-100" : "opacity-0 group-hover/device:opacity-100"}`}>
              <Tip label={`Rotate ${device.name}`} keys="R" side="top">
                <button
                  type="button"
                  aria-label={`Rotate ${device.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    useSimulatorStore.getState().rotate(slot.slotId);
                  }}
                  className="grid size-6 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
                >
                  <RotateIcon width={13} height={13} />
                </button>
              </Tip>
              {multi && (
                <Tip label={solo ? "Show all devices" : `Solo focus ${device.name}`} keys={solo ? "Esc" : undefined} side="top">
                  <button
                    type="button"
                    aria-label={solo ? "Exit solo view" : `Focus ${device.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      useSimulatorStore.getState().toggleSoloSlot(slot.slotId);
                    }}
                    className={`grid size-6 place-items-center rounded-full transition-colors ${
                      solo ? "bg-accent text-accent-ink" : "text-muted hover:bg-raised hover:text-ink"
                    }`}
                  >
                    <ExpandIcon width={12} height={12} />
                  </button>
                </Tip>
              )}
              {multi && !solo && (
                <Tip label={`Remove ${device.name}`} side="top">
                  <button
                    type="button"
                    aria-label={`Remove ${device.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      useSimulatorStore.getState().removeSlot(slot.slotId);
                    }}
                    className="grid size-6 place-items-center rounded-full text-muted transition-colors hover:bg-danger/15 hover:text-danger"
                  >
                    <CloseIcon width={13} height={13} />
                  </button>
                </Tip>
              )}
            </span>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

/** Multi-device stage next to the left rail; scales all visible devices proportionally over the chosen backdrop. */
export function Stage({ registry }: { registry: CaptureRegistry }) {
  const containerRef = useRef<HTMLElement>(null);
  const available = useElementSize(containerRef);
  const slots = useSimulatorStore((state) => state.slots);
  const activeSlotId = useSimulatorStore((state) => state.activeSlotId);
  const soloSlotId = useSimulatorStore((state) => state.soloSlotId);
  const customDevices = useSimulatorStore((state) => state.customDevices);
  const finishes = useSimulatorStore((state) => state.finishes);
  const zoom = useSimulatorStore((state) => state.zoom);
  const statusBar = useSimulatorStore((state) => state.statusBar);
  const demoStatusBar = useSimulatorStore((state) => state.demoStatusBar);
  const browserBars = useSimulatorStore((state) => state.browserBars);
  const theme = useSimulatorStore((state) => state.theme);
  const barTheme = useSimulatorStore((state) => state.barTheme);
  const stageBgId = useSimulatorStore((state) => state.stageBg);
  const customBackgrounds = useSimulatorStore((state) => state.customBackgrounds);
  const capturing = useSimulatorStore((state) => state.capturing);
  const screenshotIncludeBg = useSimulatorStore((state) => state.screenshotIncludeBg);
  const recordingStatus = useSimulatorStore((state) => state.recording.status);
  const recordTarget = useSimulatorStore((state) => state.recordTarget);

  const barTone: Tone = barTheme === "auto" ? theme : barTheme;
  const bgStyle = useMemo(() => resolveStageBackgroundStyle(stageBgId, customBackgrounds), [stageBgId, customBackgrounds]);

  const recordingActive = recordingStatus !== "idle";
  const singleDeviceCapture = (capturing !== null && capturing !== "all") || recordingActive;
  const promotedSlotId = singleDeviceCapture ? activeSlotId : soloSlotId;
  const captureBgPad =
    (recordingActive && recordTarget === "stage-bg") || (capturing === "frame" && screenshotIncludeBg)
      ? RECORD_BG_PADDING
      : 0;
  const recordBgPad = recordingActive && recordTarget === "stage-bg" ? RECORD_BG_PADDING : 0;

  const items = useMemo(
    () =>
      slots.map((slot) => {
        const base = findDevice(slot.deviceId, customDevices) ?? resolveDevice(DEFAULT_DEVICE_ID);
        const device = withFinish(base, finishes[base.id]);
        const layout = frameLayout(device, slot.orientation, { statusBar, browserBars });
        return { slot, device, layout };
      }),
    [slots, customDevices, finishes, statusBar, browserBars],
  );

  const visibleItems = useMemo(
    () => (promotedSlotId ? items.filter((item) => item.slot.slotId === promotedSlotId) : items),
    [items, promotedSlotId],
  );

  const combined = useMemo(() => multiStageSize(visibleItems.map((item) => item.layout.outer), STAGE_GAP), [visibleItems]);
  const measured = available.width > 0 && available.height > 0;
  const hideChrome = capturing !== null || recordingActive;
  const effectiveZoom = singleDeviceCapture && zoom === "fit" ? "fit" : zoom;
  const scale = zoomScale(effectiveZoom, combined, {
    width: available.width - SIDE_PADDING * 2 - captureBgPad * 2,
    height: available.height - TOP_PADDING - BOTTOM_PADDING - (hideChrome ? 0 : CAPTION_HEIGHT) - captureBgPad * 2,
  });
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useEffect(() => {
    registry.stageCanvas = containerRef.current;
    return () => {
      registry.stageCanvas = null;
    };
  }, [registry]);

  // Ctrl / Cmd + wheel steps zoom; Esc exits Solo view when no drawer is open.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let last = 0;
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (event.timeStamp - last < WHEEL_STEP_MS || event.deltaY === 0) return;
      last = event.timeStamp;
      useSimulatorStore.getState().setPreference("zoom", stepZoom(scaleRef.current, event.deltaY < 0 ? "in" : "out"));
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      const state = useSimulatorStore.getState();
      if (event.key === "Escape" && state.soloSlotId && state.panel === null && state.customDialog === null) {
        state.exitSolo();
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const multi = slots.length > 1;
  const soloActive = soloSlotId !== null && multi;
  const hasBackdrop = true;

  return (
    <main ref={containerRef} className="stage no-scrollbar relative min-w-0 flex-1 overflow-auto" style={bgStyle}>
      {soloActive && !hideChrome && (
        <div className="pointer-events-none fixed right-4 top-3 z-20 flex justify-end">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-glass-line bg-glass p-1 text-xs">
            <span className="pl-2.5 pr-1 text-muted">Solo view</span>
            <button
              type="button"
              onClick={() => useSimulatorStore.getState().exitSolo()}
              className="rounded-full bg-accent px-3 py-1 font-medium text-accent-ink transition hover:brightness-110"
            >
              Show all {slots.length} devices
            </button>
          </div>
        </div>
      )}

      <div
        className="flex min-h-full w-max min-w-full items-center justify-center"
        style={{ padding: `${TOP_PADDING}px ${SIDE_PADDING}px ${BOTTOM_PADDING}px`, visibility: measured ? "visible" : "hidden" }}
      >
        <div
          ref={(el) => {
            registry.stage = el;
          }}
          className="flex items-end justify-center"
          style={{ gap: Math.round(STAGE_GAP * scale) }}
        >
          {items.map(({ slot, device, layout }) => {
            const hiddenOffscreen = promotedSlotId !== null && slot.slotId !== promotedSlotId;
            return (
              <StageDevice
                key={slot.slotId}
                slot={slot}
                device={device}
                layout={layout}
                scale={scale}
                barTone={barTone}
                demoStatusBar={demoStatusBar}
                active={slot.slotId === activeSlotId}
                multi={multi}
                solo={soloActive}
                hiddenOffscreen={hiddenOffscreen}
                bgPad={hiddenOffscreen ? 0 : recordBgPad}
                hasBackdrop={hasBackdrop}
                registry={registry}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
