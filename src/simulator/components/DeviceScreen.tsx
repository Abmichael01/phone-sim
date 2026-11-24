import { useEffect, useMemo, useRef, useState } from "react";
import { buildFrameEnv, detectChromeMajor } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";
import { frameMessageSchema } from "@/shared/messages";
import { useSimulatorStore } from "@/stores/simulator";
import { broadcastScroll, isSlotFrameWindow, notifyAutoScrollDone, registerFrame, sendFrameConfig, sendSpaNav, unregisterFrame } from "../frameBridge";
import type { Tone } from "./frame/tone";
import { EmptyState, PreparingState, UnreachableNotice } from "./ScreenStates";

/** How long after `load` the site has to have reported in before it counts as unreachable. */
const REPORT_GRACE_MS = 400;

/** Lets the site run normally while stopping it from navigating the simulator tab away. */
const SANDBOX = [
  "allow-scripts",
  "allow-same-origin",
  "allow-forms",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-modals",
  "allow-downloads",
  "allow-presentation",
  "allow-pointer-lock",
  "allow-storage-access-by-user-activation",
].join(" ");

const chromeMajor = detectChromeMajor(navigator);

function SiteFrame({ slotId, device, url }: { slotId: string; device: Device; url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reportedRef = useRef(false);
  const timerRef = useRef(0);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const frameStatus = useSimulatorStore((state) => state.slotRuntime[slotId]?.frameStatus ?? "loading");
  const touchCursor = useSimulatorStore((state) => state.touchCursor);
  const syncScroll = useSimulatorStore((state) => state.syncScroll);
  const name = useMemo(
    () => JSON.stringify(buildFrameEnv(device, chromeMajor, chrome.runtime.id, touchCursor, syncScroll)),
    [device, touchCursor, syncScroll],
  );

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const store = useSimulatorStore.getState();
    registerFrame(slotId, frame);
    store.resetSlotHistory(slotId);
    store.setSlotFrameStatus(slotId, "loading");

    const onMessage = (event: MessageEvent<unknown>): void => {
      if (!isSlotFrameWindow(slotId, event.source) || event.source !== frame.contentWindow) return;
      const parsed = frameMessageSchema.safeParse(event.data);
      if (!parsed.success) return;
      const state = useSimulatorStore.getState();
      if (parsed.data.kind === "focus") {
        state.setActiveSlot(slotId);
        return;
      }
      if (parsed.data.kind === "auto-scroll-done") {
        notifyAutoScrollDone(slotId);
        return;
      }
      if (parsed.data.kind === "scroll") {
        if (state.syncScroll) broadcastScroll(slotId, parsed.data.ratioX, parsed.data.ratioY);
        return;
      }
      reportedRef.current = true;
      const softTargets = state.reportFrame(slotId, parsed.data.href, parsed.data.nav);
      for (const targetId of softTargets) {
        sendSpaNav(targetId, parsed.data.href, parsed.data.nav === "replace");
      }
      if (parsed.data.nav === "load") sendFrameConfig(slotId, state.touchCursor, state.syncScroll);
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timerRef.current);
      unregisterFrame(slotId, frame);
    };
  }, [slotId]);

  useEffect(() => {
    sendFrameConfig(slotId, touchCursor, syncScroll);
  }, [slotId, touchCursor, syncScroll]);

  const handleLoad = (): void => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const reported = reportedRef.current;
      reportedRef.current = false;
      if (!reported) setNoticeDismissed(false);
      useSimulatorStore.getState().setSlotFrameStatus(slotId, reported ? "loaded" : "unreachable");
    }, REPORT_GRACE_MS);
  };

  const openInTab = (): void => {
    const href = useSimulatorStore.getState().slotRuntime[slotId]?.frameHref;
    void chrome.tabs.create({ url: href ?? url });
  };

  return (
    <div className="relative h-full w-full bg-white">
      <iframe
        ref={iframeRef}
        name={name}
        src={url}
        title={`${device.name} simulated website`}
        className="block h-full w-full border-0 bg-white"
        sandbox={SANDBOX}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        onLoad={handleLoad}
      />
      {frameStatus === "loading" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-black/15">
          <div className="h-full w-1/3 animate-[phone-sim-progress_1.1s_ease-in-out_infinite] bg-[#2563eb]" />
        </div>
      )}
      {frameStatus === "unreachable" && !noticeDismissed && (
        <UnreachableNotice
          onRetry={() => useSimulatorStore.getState().reload(slotId)}
          onOpenInTab={openInTab}
          onDismiss={() => setNoticeDismissed(true)}
        />
      )}
    </div>
  );
}

/** Content of one device screen between the bars: the site, or a state message. */
export function DeviceScreen({ slotId, device, tone }: { slotId: string; device: Device; tone: Tone }) {
  const slotUrl = useSimulatorStore((state) => state.slotRuntime[slotId]?.url ?? state.url);
  const rulesReady = useSimulatorStore((state) => state.rulesReady);
  const reloadNonce = useSimulatorStore((state) => state.slotRuntime[slotId]?.reloadNonce ?? 0);

  if (!slotUrl) return <EmptyState tone={tone} />;
  if (!rulesReady) return <PreparingState tone={tone} />;
  return (
    <SiteFrame
      key={`${slotId}:${device.id}:${device.platform}:${device.kind}:${reloadNonce}`}
      slotId={slotId}
      device={device}
      url={slotUrl}
    />
  );
}
