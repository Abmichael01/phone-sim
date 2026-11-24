import { spawn } from "node:child_process";
import { request } from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/** Side effects the CLI needs from the operating system, kept out of the pure modules. */

/** Whether anything answers HTTP on localhost:port within `timeoutMs`. */
export function httpProbe(port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const req = request({ host: "localhost", port, path: "/", method: "GET", timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

/** Opens a file with the system's default app (detached; errors are ignored). */
export function openWithSystem(path: string): void {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [path]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", path]]
        : ["xdg-open", [path]];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.on("error", () => undefined);
    child.unref();
  } catch {
    // Opening the report is a convenience; the path is printed anyway.
  }
}

export const INSTALL_COMMAND = "npx playwright install chromium";

/** Playwright's own message when its browser has not been downloaded. */
export function isMissingBrowserError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /Executable doesn't exist|browserType\.launch:.*(install|download)|playwright install/i.test(text);
}

/**
 * Downloads the headless Chromium that matches the installed Playwright, using
 * Playwright's own installer. Progress goes to stderr so --json stdout stays clean.
 */
export function installHeadlessChromium(): Promise<boolean> {
  return new Promise((resolve) => {
    let cli: string;
    try {
      const require = createRequire(import.meta.url);
      cli = join(dirname(require.resolve("playwright/package.json")), "cli.js");
    } catch {
      resolve(false);
      return;
    }
    // --no-remove keeps browser versions other projects on this machine still use.
    const child = spawn(process.execPath, [cli, "install", "--only-shell", "--no-remove", "chromium"], {
      stdio: ["ignore", 2, 2],
    });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}
