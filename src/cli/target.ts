import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Common local dev server ports, tried in this order when no URL is given. */
export const DEV_PORTS: readonly number[] = [3000, 5173, 4321, 8080, 8000, 4200, 3001];

export type Target = { ok: true; url: string; kind: "web" | "file" } | { ok: false; message: string };

const LOCAL_HOST = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|[^/:]+\.localhost|[^/:]+\.local|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2})(?=$|[:/?#])/i;

function looksLikePath(input: string): boolean {
  if (input.startsWith("./") || input.startsWith("../") || input.startsWith("/") || input.startsWith("~") || input.includes("\\")) {
    return true;
  }
  // host:port/…, localhost/… and domain.tld/… are URLs even when they end in .html.
  if (/^[^/]+:\d+(\/|$)/.test(input) || LOCAL_HOST.test(input) || /^[^/]+\.[^/]+\//.test(input)) return false;
  return /\.html?$/i.test(input);
}

/**
 * Turns what a person types into a URL:
 * `3000` / `:3000` → http://localhost:3000/, `localhost:5173` → http://…,
 * `example.com` → https://…, `./page.html` → file://…
 */
export function normalizeTarget(input: string, cwd: string, home = ""): Target {
  const text = input.trim();
  if (text === "") return { ok: false, message: "The URL is empty." };

  const port = /^:?(\d{2,5})$/.exec(text);
  if (port?.[1]) {
    const number = Number(port[1]);
    if (number < 1 || number > 65535) return { ok: false, message: `${text} is not a valid port number.` };
    return { ok: true, url: `http://localhost:${number}/`, kind: "web" };
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
  if (!hasScheme && looksLikePath(text)) {
    const expanded = text.startsWith("~") && home ? home + text.slice(1) : text;
    return { ok: true, url: pathToFileURL(resolve(cwd, expanded)).href, kind: "file" };
  }

  const candidate = hasScheme ? text : `${LOCAL_HOST.test(text) ? "http" : "https"}://${text}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, message: `"${text}" is not a URL.` };
  }
  if (url.protocol === "file:") return { ok: true, url: url.href, kind: "file" };
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: `Only http, https and file URLs can be checked (got ${url.protocol}).` };
  }
  if (!url.hostname) return { ok: false, message: `"${text}" has no host name.` };
  return { ok: true, url: url.href, kind: "web" };
}

/** Whether something answers HTTP on this local port. */
export type PortProbe = (port: number) => Promise<boolean>;

/** The first port (in `ports` order) whose probe answers, probing all at once. */
export async function findDevServer(probe: PortProbe, ports: readonly number[] = DEV_PORTS): Promise<number | null> {
  const results = await Promise.all(ports.map((port) => probe(port).catch(() => false)));
  const index = results.findIndex(Boolean);
  return index === -1 ? null : (ports[index] ?? null);
}
