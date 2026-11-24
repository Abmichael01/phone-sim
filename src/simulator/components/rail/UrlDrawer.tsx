import { useEffect, useRef, useState, type FormEvent } from "react";
import { normalizeUrl, type UrlProblem } from "@/shared/url";
import { useSimulatorStore } from "@/stores/simulator";
import { ExternalIcon, GlobeIcon, LockIcon } from "../icons";
import { Drawer } from "../ui";

const PROBLEM_TEXT: Record<UrlProblem, string> = {
  empty: "Type a web address, like example.com.",
  unsupported: "Browser pages (chrome://, opera://, about:, file://) can't be shown in a frame.",
  invalid: "That doesn't look like a web address.",
};

function parseUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/** Left-docked address drawer: edit URL once to load across all active devices. */
export function UrlDrawer() {
  const activeSlotId = useSimulatorStore((state) => state.activeSlotId);
  const slotHref = useSimulatorStore((state) => state.slotRuntime[activeSlotId]?.frameHref ?? state.slotRuntime[activeSlotId]?.url);
  const fallbackUrl = useSimulatorStore((state) => state.url);
  const slotCount = useSimulatorStore((state) => state.slots.length);
  const current = slotHref ?? fallbackUrl;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(current ?? "");

  useEffect(() => {
    setDraft(current ?? "");
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [current]);

  const parsed = parseUrl(current);
  const domain = parsed ? parsed.host.replace(/^www\./, "") : "";

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const result = normalizeUrl(draft);
    const store = useSimulatorStore.getState();
    if (!result.ok) {
      store.showToast("error", PROBLEM_TEXT[result.problem]);
      return;
    }
    store.navigate(result.url);
  };

  return (
    <Drawer label="Web address" className="top-2 w-[390px] space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {parsed?.protocol === "https:" ? <LockIcon width={13} height={13} /> : <GlobeIcon width={13} height={13} />}
          <span className="truncate">{domain || "Web address"}</span>
        </span>
        {current && (
          <button
            type="button"
            onClick={() => void chrome.tabs.create({ url: current })}
            className="flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
          >
            <ExternalIcon width={12} height={12} />
            Open in tab
          </button>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://example.com"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Web address"
          className="h-10 min-w-0 flex-1 rounded-full border border-line bg-raised px-4 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-accent px-5 text-[13px] font-semibold text-accent-ink transition hover:brightness-110"
        >
          Go
        </button>
      </form>

      <p className="text-[11.5px] text-muted">
        {slotCount > 1 ? `Loads simultaneously across all ${slotCount} devices on stage.` : "Press Enter to load inside the device."}
      </p>
    </Drawer>
  );
}
