import { customDeviceSchema } from "@/schemas/customDevice";
import type { Device } from "@/schemas/device";

const STORAGE_KEY = "customDevices";

/** Valid custom devices from storage; invalid or duplicate entries are dropped one by one. */
export function parseCustomDevices(raw: unknown): Device[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: Device[] = [];
  for (const item of raw) {
    const parsed = customDeviceSchema.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    result.push(parsed.data);
  }
  return result;
}

export async function loadCustomDevices(): Promise<Device[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return parseCustomDevices(stored[STORAGE_KEY]);
}

export async function saveCustomDevices(list: readonly Device[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: parseCustomDevices(list) });
}

/** Calls `listener` whenever another tab (or this one) changes the custom devices. Returns an unsubscribe. */
export function onCustomDevicesChanged(listener: (list: Device[]) => void): () => void {
  const handle = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    const change = changes[STORAGE_KEY];
    if (area === "local" && change) listener(parseCustomDevices(change.newValue));
  };
  chrome.storage.onChanged.addListener(handle);
  return () => chrome.storage.onChanged.removeListener(handle);
}
