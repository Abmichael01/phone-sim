import { DEFAULT_SETTINGS, settingsSchema, type Settings } from "@/schemas/settings";

const STORAGE_KEY = "settings";

/** Turns whatever is stored into valid settings; anything unusable becomes the default. */
export function parseSettings(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ...DEFAULT_SETTINGS };
  return settingsSchema.parse({ ...DEFAULT_SETTINGS, ...raw });
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return parseSettings(stored[STORAGE_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settingsSchema.parse(settings) });
}
