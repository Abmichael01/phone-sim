import { z } from "zod";
import { deviceSchema, type Device, type DeviceKind } from "@/schemas/device";
import { appleDevices } from "./catalog/apple";
import { googleDevices } from "./catalog/google";
import { otherDevices } from "./catalog/others";
import { samsungDevices } from "./catalog/samsung";

/** Every device, validated once at load. A bad catalog entry fails loudly here. */
export const devices: readonly Device[] = z
  .array(deviceSchema)
  .parse([...appleDevices, ...samsungDevices, ...googleDevices, ...otherDevices]);

export const DEFAULT_DEVICE_ID = "iphone-16-pro";

const devicesById = new Map(devices.map((device) => [device.id, device]));

export function getDevice(id: string): Device | undefined {
  return devicesById.get(id);
}

/** The device for `id`, or the default device when the id is unknown (e.g. removed). */
export function resolveDevice(id: string): Device {
  const device = devicesById.get(id) ?? devicesById.get(DEFAULT_DEVICE_ID);
  if (!device) throw new Error(`Default device "${DEFAULT_DEVICE_ID}" is missing from the catalog`);
  return device;
}

/** Brands shown first in the picker; any other brand follows alphabetically. */
const BRAND_PRIORITY = ["Apple", "Samsung", "Google"];

function brandRank(brand: string): number {
  const index = BRAND_PRIORITY.indexOf(brand);
  return index === -1 ? BRAND_PRIORITY.length : index;
}

export function compareBrands(a: string, b: string): number {
  return brandRank(a) - brandRank(b) || a.localeCompare(b);
}

const KIND_ORDER: Record<DeviceKind, number> = { phone: 0, foldable: 1, tablet: 2 };

/** Newest first; within a year phones, then foldables, then tablets; larger screens first, then by name. */
export function sortNewestFirst(list: readonly Device[]): Device[] {
  return [...list].sort(
    (a, b) =>
      b.year - a.year ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      b.screen.width * b.screen.height - a.screen.width * a.screen.height ||
      a.name.localeCompare(b.name),
  );
}

export interface BrandGroup {
  brand: string;
  devices: Device[];
}

/** Groups devices by brand (priority brands first), each group newest first. */
export function groupByBrand(list: readonly Device[]): BrandGroup[] {
  const groups = new Map<string, Device[]>();
  for (const device of list) {
    const group = groups.get(device.brand);
    if (group) group.push(device);
    else groups.set(device.brand, [device]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compareBrands(a, b))
    .map(([brand, members]) => ({ brand, devices: sortNewestFirst(members) }));
}

export const brands: readonly string[] = [...new Set(devices.map((device) => device.brand))].sort(compareBrands);

/** Picker filter: everything, one device kind, or one brand. */
export type DeviceFilter = { type: "all" } | { type: "kind"; kind: DeviceKind } | { type: "brand"; brand: string };

function matchesFilter(device: Device, filter: DeviceFilter): boolean {
  switch (filter.type) {
    case "all":
      return true;
    case "kind":
      return device.kind === filter.kind;
    case "brand":
      return device.brand === filter.brand;
  }
}

/** Case-insensitive search over name and brand; every word of the query must match. */
export function filterDevices(list: readonly Device[], query: string, filter: DeviceFilter): Device[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((device) => {
    if (!matchesFilter(device, filter)) return false;
    const haystack = `${device.brand} ${device.name}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

/** "390×844 @3x" */
export function formatScreen(device: Device): string {
  return `${device.screen.width}×${device.screen.height} @${device.dpr}x`;
}
