import { describe, expect, it } from "vitest";
import { deviceSchema } from "@/schemas/device";
import { appleDevices } from "./catalog/apple";
import { googleDevices } from "./catalog/google";
import { otherDevices } from "./catalog/others";
import { samsungDevices } from "./catalog/samsung";
import {
  DEFAULT_DEVICE_ID,
  brands,
  devices,
  filterDevices,
  findDevice,
  formatScreen,
  getDevice,
  groupByBrand,
  resolveDevice,
  sortNewestFirst,
  withFinish,
} from "./index";

const catalog = [...appleDevices, ...samsungDevices, ...googleDevices, ...otherDevices];

describe("device catalog", () => {
  it("has at least 60 devices", () => {
    expect(devices.length).toBeGreaterThanOrEqual(60);
  });

  it.each(catalog.map((entry) => [entry.id, entry] as const))("%s passes the schema", (_id, entry) => {
    expect(deviceSchema.safeParse(entry).success).toBe(true);
  });

  it("uses unique ids", () => {
    const ids = devices.map((device) => device.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate names within a brand", () => {
    const keys = devices.map((device) => `${device.brand}/${device.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("stores every screen in portrait with sane sizes", () => {
    for (const device of devices) {
      expect(device.screen.width, device.id).toBeLessThan(device.screen.height);
      expect(device.screen.width, device.id).toBeGreaterThanOrEqual(240);
      expect(device.screen.height, device.id).toBeLessThanOrEqual(1600);
      expect(device.dpr, device.id).toBeGreaterThanOrEqual(1);
      expect(device.dpr, device.id).toBeLessThanOrEqual(5);
      expect(device.frame.screenRadius * 2, device.id).toBeLessThan(device.screen.width);
      if (device.frame.rim !== undefined) expect(device.frame.rim, device.id).toBeLessThan(device.frame.bezel);
    }
  });

  it("lists the base colour as the first finish", () => {
    for (const device of devices) {
      const [first] = device.frame.finishes ?? [];
      if (first) expect(first.color.toLowerCase(), device.id).toBe(device.frame.color.toLowerCase());
      const names = (device.frame.finishes ?? []).map((finish) => finish.name);
      expect(new Set(names).size, device.id).toBe(names.length);
    }
  });

  it("applies a saved finish and ignores unknown ones", () => {
    const device = resolveDevice("iphone-16-pro");
    expect(withFinish(device, "Desert Titanium").frame.color).toBe("#bfae98");
    expect(withFinish(device, "Hot Pink")).toBe(device);
    expect(withFinish(device, undefined)).toBe(device);
  });

  it("finds custom devices after the catalog", () => {
    const custom = { ...resolveDevice("pixel-8"), id: "custom-test-1", brand: "Custom" };
    expect(findDevice("custom-test-1", [custom])).toBe(custom);
    expect(findDevice("pixel-8", [custom])?.brand).toBe("Google");
    expect(findDevice("custom-missing", [custom])).toBeUndefined();
  });

  it("matches platform to brand family", () => {
    for (const device of devices) {
      if (device.brand === "Apple") expect(["ios", "ipados"]).toContain(device.platform);
      else expect(device.platform, device.id).toBe("android");
      if (device.platform === "ipados") expect(device.kind).toBe("tablet");
    }
  });

  it("includes the default device", () => {
    expect(getDevice(DEFAULT_DEVICE_ID)?.name).toBe("iPhone 16 Pro");
  });
});

describe("device lookup and grouping", () => {
  it("resolves unknown ids to the default device", () => {
    expect(resolveDevice("no-such-phone").id).toBe(DEFAULT_DEVICE_ID);
    expect(resolveDevice("pixel-8").id).toBe("pixel-8");
  });

  it("puts Apple, Samsung and Google first, then the rest alphabetically", () => {
    expect(brands.slice(0, 3)).toEqual(["Apple", "Samsung", "Google"]);
    const rest = brands.slice(3);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
  });

  it("sorts newest first", () => {
    const sorted = sortNewestFirst(devices);
    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1]!.year).toBeGreaterThanOrEqual(sorted[index]!.year);
    }
  });

  it("groups by brand without losing devices", () => {
    const groups = groupByBrand(devices);
    expect(groups.map((group) => group.brand)).toEqual(brands);
    expect(groups.reduce((total, group) => total + group.devices.length, 0)).toBe(devices.length);
  });

  it("filters by search words, kind and brand", () => {
    expect(filterDevices(devices, "iphone 16 pro", { type: "all" }).map((d) => d.id)).toEqual(
      expect.arrayContaining(["iphone-16-pro", "iphone-16-pro-max"]),
    );
    expect(filterDevices(devices, "", { type: "kind", kind: "tablet" }).every((d) => d.kind === "tablet")).toBe(true);
    expect(filterDevices(devices, "fold", { type: "brand", brand: "Samsung" }).every((d) => d.brand === "Samsung")).toBe(true);
    expect(filterDevices(devices, "samsung pixel", { type: "all" })).toEqual([]);
  });

  it("formats the screen summary", () => {
    expect(formatScreen(resolveDevice("iphone-14"))).toBe("390×844 @3x");
  });
});
