import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { normalizeUrl, type UrlProblem } from "@/shared/url";
import { useSimulatorStore } from "@/stores/simulator";
import { ExternalIcon, InfoIcon, ReloadIcon } from "./icons";

const PROBLEM_TEXT: Record<UrlProblem, string> = {
  empty: "Type a web address, like example.com.",
  unsupported: "Browser pages (chrome://, opera://, about:, file://) can't be shown in a frame.",
  invalid: "That doesn't look like a web address.",
};

const COOKIE_HINT =
  "Pages open inside a frame. Sites that need you to be logged in may require third-party cookies to be allowed for that site.";

/** Address bar for the framed site, with reload and open-in-new-tab. */
export function UrlBar() {
  const url = useSimulatorStore((state) => state.url);
  const frameHref = useSimulatorStore((state) => state.frameHref);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const shown = frameHref ?? url ?? "";

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const result = normalizeUrl(draft);
    const store = useSimulatorStore.getState();
    if (!result.ok) {
      store.showToast("error", PROBLEM_TEXT[result.problem]);
      return;
    }
    store.navigate(result.url);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") inputRef.current?.blur();
  };

  const iconButton =
    "grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-line hover:text-ink disabled:pointer-events-none disabled:opacity-35";

  return (
    <form onSubmit={submit} className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-xl border border-line bg-panel pl-3 pr-1 focus-within:border-accent">
      <input
        ref={inputRef}
        value={editing ? draft : shown}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => {
          setDraft(shown);
          setEditing(true);
          event.target.select();
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={onKeyDown}
        placeholder="Type a web address"
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-label="Web address"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
      />
      <span className={iconButton} title={COOKIE_HINT} aria-label={COOKIE_HINT} role="img">
        <InfoIcon width={16} height={16} />
      </span>
      <button type="button" className={iconButton} disabled={!url} onClick={() => useSimulatorStore.getState().reload()} title="Reload" aria-label="Reload">
        <ReloadIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={!shown}
        onClick={() => void chrome.tabs.create({ url: shown })}
        title="Open in a new tab"
        aria-label="Open in a new tab"
      >
        <ExternalIcon width={16} height={16} />
      </button>
    </form>
  );
}
