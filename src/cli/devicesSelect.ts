import { sortNewestFirst } from "@/devices";
import type { Device } from "@/schemas/device";

export const PRESET_NAMES = ["common", "phones", "all-sizes"] as const;
export type PresetName = (typeof PRESET_NAMES)[number];

/** Fixed presets. A unit test checks every id exists in the catalog. */
export const FIXED_PRESETS: Record<Exclude<PresetName, "all-sizes">, readonly string[]> = {
  common: ["iphone-se-3", "iphone-16-pro", "galaxy-a16", "pixel-9", "ipad-mini-a17-pro"],
  phones: ["iphone-se-3", "iphone-16-pro", "iphone-17-pro-max", "galaxy-a16", "galaxy-s25-ultra", "pixel-9"],
};

/**
 * CSS-width buckets for `all-sizes` (upper bounds, inclusive): small phones,
 * classic phones, current phones, large phones, foldable inner screens,
 * small tablets, large tablets.
 */
export const WIDTH_BUCKETS: readonly number[] = [360, 380, 400, 420, 500, 760, 900, Number.POSITIVE_INFINITY];

/**
 * One device per CSS width bucket: the bucket's most common width (what most
 * real phones in that class report), then the newest confirmed device with it.
 */
export function allSizesPreset(catalog: readonly Device[]): Device[] {
  const newest = sortNewestFirst(catalog);
  const picked: Device[] = [];
  let lower = 0;
  for (const upper of WIDTH_BUCKETS) {
    const inBucket = newest.filter((device) => device.screen.width > lower && device.screen.width <= upper);
    lower = upper;
    const counts = new Map<number, number>();
    for (const device of inBucket) counts.set(device.screen.width, (counts.get(device.screen.width) ?? 0) + 1);
    const [commonWidth] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? [];
    const withWidth = inBucket.filter((device) => device.screen.width === commonWidth);
    const choice = withWidth.find((device) => !device.approx) ?? withWidth[0];
    if (choice) picked.push(choice);
  }
  return picked;
}

function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0] ?? 0;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j] ?? 0;
      const left = previous[j - 1] ?? 0;
      previous[j] = Math.min(above + 1, left + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length] ?? 0;
}

/** The `limit` catalog ids closest to `input` (ids containing it rank first). */
export function closestIds(input: string, catalog: readonly Device[], limit = 3): string[] {
  const wanted = input.toLowerCase().trim();
  return catalog
    .map((device) => {
      const distance = levenshtein(wanted, device.id);
      const contains = device.id.includes(wanted) || wanted.includes(device.id);
      return { id: device.id, score: contains ? distance - 100 : distance };
    })
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((entry) => entry.id);
}

export type DeviceSelection =
  | { ok: true; devices: Device[] }
  | { ok: false; message: string; suggestions: string[] };

/** Resolves `--devices` ids (in the given order) or a preset name to catalog devices. */
export function selectDevices(
  input: { devices?: readonly string[] | undefined; preset?: PresetName | undefined },
  catalog: readonly Device[],
): DeviceSelection {
  const byId = new Map(catalog.map((device) => [device.id, device]));
  if (input.devices && input.devices.length > 0) {
    const picked: Device[] = [];
    for (const id of input.devices) {
      const device = byId.get(id);
      if (!device) {
        const suggestions = closestIds(id, catalog);
        return { ok: false, message: `Unknown device ${id}. Did you mean: ${suggestions.join(", ")}?`, suggestions };
      }
      if (!picked.includes(device)) picked.push(device);
    }
    return { ok: true, devices: picked };
  }
  const preset = input.preset ?? "common";
  if (preset === "all-sizes") return { ok: true, devices: allSizesPreset(catalog) };
  const devices = FIXED_PRESETS[preset].flatMap((id) => {
    const device = byId.get(id);
    return device ? [device] : [];
  });
  return { ok: true, devices };
}
