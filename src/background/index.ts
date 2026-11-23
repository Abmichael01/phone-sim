import { getDevice } from "@/devices";
import { detectChromeMajor } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";
import { backgroundRequestSchema, type BackgroundRequest, type BackgroundResponse } from "@/shared/messages";
import { isWebUrl, SIMULATOR_PAGE, simulatorPagePath } from "@/shared/url";
import { allocateRuleIds, buildTabRules, tabRuleIds } from "./rules";

const MOBILE_ENV_SCRIPT_ID = "phone-sim-mobile-env";
const MENU_OPEN_PAGE = "phone-sim-open-page";
const MENU_OPEN_LINK = "phone-sim-open-link";
const WEB_PATTERNS = ["http://*/*", "https://*/*"];

const simulatorUrl = chrome.runtime.getURL(SIMULATOR_PAGE);
const chromeMajor = detectChromeMajor(navigator);

function isSimulatorUrl(url: string | undefined): boolean {
  return url !== undefined && url.startsWith(simulatorUrl);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Opening the simulator

async function openSimulator(targetUrl: string | undefined, besideTab: chrome.tabs.Tab | undefined): Promise<void> {
  const url = chrome.runtime.getURL(simulatorPagePath(isWebUrl(targetUrl) ? targetUrl : null));
  if (!besideTab) {
    await chrome.tabs.create({ url });
    return;
  }
  await chrome.tabs.create({
    url,
    index: besideTab.index + 1,
    windowId: besideTab.windowId,
    ...(besideTab.id !== undefined && besideTab.id >= 0 ? { openerTabId: besideTab.id } : {}),
  });
}

async function createContextMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_OPEN_PAGE,
    title: "Open page in Phone Sim",
    contexts: ["page"],
    documentUrlPatterns: WEB_PATTERNS,
  });
  chrome.contextMenus.create({
    id: MENU_OPEN_LINK,
    title: "Open link in Phone Sim",
    contexts: ["link"],
    targetUrlPatterns: WEB_PATTERNS,
  });
}

// Header rules (session rules scoped to simulator tabs only)

/**
 * Rule changes read the current rules and then write, so they run one at a
 * time; otherwise two simulator tabs could claim the same free rule ids.
 */
let ruleQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = ruleQueue.then(task, task);
  ruleQueue = run.catch(() => undefined);
  return run;
}

function removeTabRules(tabId: number): Promise<void> {
  return serialized(async () => {
    const removeRuleIds = tabRuleIds(await chrome.declarativeNetRequest.getSessionRules(), tabId);
    if (removeRuleIds.length > 0) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
  });
}

function applyTabRules(tabId: number, device: Device): Promise<void> {
  return serialized(async () => {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    const ids = allocateRuleIds(rules, tabId);
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [...new Set([...tabRuleIds(rules, tabId), ...ids])],
      addRules: buildTabRules(ids, tabId, device, chromeMajor),
    });
  });
}

/**
 * Session rules survive service-worker restarts, so only rules whose tab is gone
 * or no longer shows the simulator are stale.
 */
function clearStaleRules(): Promise<void> {
  return serialized(async () => {
    const [rules, tabs] = await Promise.all([chrome.declarativeNetRequest.getSessionRules(), chrome.tabs.query({})]);
    const simulatorTabIds = new Set(
      tabs.filter((tab) => isSimulatorUrl(tab.url ?? tab.pendingUrl)).flatMap((tab) => (tab.id === undefined ? [] : [tab.id])),
    );
    const stale = rules
      .filter((rule) => !(rule.condition.tabIds ?? []).some((tabId) => simulatorTabIds.has(tabId)))
      .map((rule) => rule.id);
    if (stale.length > 0) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: stale });
  });
}

async function handleRequest(request: BackgroundRequest, sender: chrome.runtime.MessageSender): Promise<BackgroundResponse> {
  const tabId = sender.tab?.id;
  if (tabId === undefined || !isSimulatorUrl(sender.url)) {
    return { ok: false, error: "Only a Phone Sim tab can apply device settings." };
  }
  const device = getDevice(request.deviceId);
  if (!device) return { ok: false, error: `Unknown device "${request.deviceId}".` };
  await applyTabRules(tabId, device);
  return { ok: true };
}

// Mobile environment script (MAIN world; it stays inert outside simulator frames)

async function ensureMobileEnvScript(): Promise<void> {
  const script: chrome.scripting.RegisteredContentScript = {
    id: MOBILE_ENV_SCRIPT_ID,
    matches: ["<all_urls>"],
    js: ["mobile-env.js"],
    allFrames: true,
    runAt: "document_start",
    world: "MAIN",
    persistAcrossSessions: true,
  };
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [MOBILE_ENV_SCRIPT_ID] });
  if (existing.length > 0) await chrome.scripting.updateContentScripts([script]);
  else await chrome.scripting.registerContentScripts([script]);
}

// Listeners (registered synchronously so a restarted worker receives the event that woke it)

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus().catch((error: unknown) => console.error("Phone Sim: context menus failed:", errorMessage(error)));
});

chrome.action.onClicked.addListener((tab) => {
  openSimulator(tab.url, tab).catch((error: unknown) => console.error("Phone Sim: could not open:", errorMessage(error)));
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const target = info.menuItemId === MENU_OPEN_LINK ? info.linkUrl : info.menuItemId === MENU_OPEN_PAGE ? info.pageUrl : undefined;
  if (target === undefined) return;
  openSimulator(target, tab).catch((error: unknown) => console.error("Phone Sim: could not open:", errorMessage(error)));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabRules(tabId).catch((error: unknown) => console.error("Phone Sim: rule cleanup failed:", errorMessage(error)));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // A simulator tab navigated somewhere else: its rules must not follow it.
  if (changeInfo.url === undefined || isSimulatorUrl(changeInfo.url)) return;
  removeTabRules(tabId).catch((error: unknown) => console.error("Phone Sim: rule cleanup failed:", errorMessage(error)));
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse: (response: BackgroundResponse) => void) => {
  if (sender.id !== chrome.runtime.id) return false;
  const parsed = backgroundRequestSchema.safeParse(message);
  if (!parsed.success) return false;
  handleRequest(parsed.data, sender).then(sendResponse, (error: unknown) =>
    sendResponse({ ok: false, error: errorMessage(error) }),
  );
  return true;
});

ensureMobileEnvScript().catch((error: unknown) =>
  console.error("Phone Sim: could not register the mobile environment script:", errorMessage(error)),
);
clearStaleRules().catch((error: unknown) => console.error("Phone Sim: stale rule cleanup failed:", errorMessage(error)));
