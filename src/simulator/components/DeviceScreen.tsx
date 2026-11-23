import { useEffect, useMemo, useRef, useState } from "react";
import { buildFrameEnv, detectChromeMajor } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";
import { frameMessageSchema } from "@/shared/messages";
import { useSimulatorStore } from "@/stores/simulator";
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

function SiteFrame({ device, url }: { device: Device; url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reportedRef = useRef(false);
  const timerRef = useRef(0);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const frameStatus = useSimulatorStore((state) => state.frameStatus);
  const name = useMemo(() => JSON.stringify(buildFrameEnv(device, chromeMajor, chrome.runtime.id)), [device]);

  useEffect(() => {
    const { setFrameStatus, reportFrameHref } = useSimulatorStore.getState();
    setFrameStatus("loading");
    const onMessage = (event: MessageEvent<unknown>): void => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const parsed = frameMessageSchema.safeParse(event.data);
      if (!parsed.success) return;
      reportedRef.current = true;
      reportFrameHref(parsed.data.href);
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleLoad = (): void => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const reported = reportedRef.current;
      // The next document in this frame must report again.
      reportedRef.current = false;
      if (!reported) setNoticeDismissed(false);
      useSimulatorStore.getState().setFrameStatus(reported ? "loaded" : "unreachable");
    }, REPORT_GRACE_MS);
  };

  const openInTab = (): void => {
    const { frameHref } = useSimulatorStore.getState();
    void chrome.tabs.create({ url: frameHref ?? url });
  };

  return (
    <div className="relative h-full w-full bg-white">
      <iframe
        ref={iframeRef}
        name={name}
        src={url}
        title="Simulated website"
        className="block h-full w-full border-0 bg-white"
        sandbox={SANDBOX}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        onLoad={handleLoad}
      />
      {frameStatus === "loading" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-[#4a5bd4]/15">
          <div className="h-full w-1/3 animate-[phone-sim-progress_1.1s_ease-in-out_infinite] bg-[#4a5bd4]" />
        </div>
      )}
      {frameStatus === "unreachable" && !noticeDismissed && (
        <UnreachableNotice
          onRetry={() => useSimulatorStore.getState().reload()}
          onOpenInTab={openInTab}
          onDismiss={() => setNoticeDismissed(true)}
        />
      )}
    </div>
  );
}

/** Content of the screen below the status bar: the site, or a state message. */
export function DeviceScreen({ device }: { device: Device }) {
  const url = useSimulatorStore((state) => state.url);
  const rulesDeviceId = useSimulatorStore((state) => state.rulesDeviceId);
  const reloadNonce = useSimulatorStore((state) => state.reloadNonce);

  if (!url) return <EmptyState />;
  if (rulesDeviceId !== device.id) return <PreparingState />;
  // A new key recreates the iframe, so a device change gets a fresh window.name and headers.
  return <SiteFrame key={`${device.id}:${reloadNonce}`} device={device} url={url} />;
}
