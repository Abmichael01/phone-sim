/** URL helpers shared by the background worker and the simulator page. */

export const SIMULATOR_PAGE = "simulator.html";

/** True for http(s) URLs: the only pages a frame can show. */
export function isWebUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Path (relative to the extension root) that opens the simulator on `url`. */
export function simulatorPagePath(url: string | null): string {
  return url ? `${SIMULATOR_PAGE}?url=${encodeURIComponent(url)}` : SIMULATOR_PAGE;
}

export type UrlProblem = "empty" | "unsupported" | "invalid";

export type NormalizedUrl = { ok: true; url: string } | { ok: false; problem: UrlProblem };

const LOCAL_HOST = /^(localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|[^/:]+\.local)(:\d+)?(\/|$)/i;
/** "scheme:" not followed by a port number, e.g. chrome:, about:, file:, javascript:. */
const OTHER_SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

/**
 * Turns what the user typed into a loadable URL: adds https:// (http:// for
 * local hosts), rejects browser-internal schemes and words that are not hosts.
 */
export function normalizeUrl(input: string): NormalizedUrl {
  const text = input.trim();
  if (!text) return { ok: false, problem: "empty" };
  if (/\s/.test(text)) return { ok: false, problem: "invalid" };

  let candidate: string;
  if (/^https?:\/\//i.test(text)) candidate = text;
  else if (OTHER_SCHEME.test(text)) return { ok: false, problem: "unsupported" };
  else candidate = `${LOCAL_HOST.test(text) ? "http" : "https"}://${text}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, problem: "invalid" };
  }
  const host = parsed.hostname;
  const looksLikeHost = host.includes(".") || host === "localhost" || host.startsWith("[");
  return looksLikeHost ? { ok: true, url: parsed.href } : { ok: false, problem: "invalid" };
}
