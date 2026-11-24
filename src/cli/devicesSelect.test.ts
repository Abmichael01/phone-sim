import { describe, expect, it } from "vitest";
import { devices, getDevice } from "@/devices";
import { allSizesPreset, closestIds, FIXED_PRESETS, selectDevices, WIDTH_BUCKETS } from "./devicesSelect";

describe("presets", () => {
  it("only name devices that exist in the catalog", () => {
    for (const [name, ids] of Object.entries(FIXED_PRESETS)) {
      for (const id of ids) expect(getDevice(id), `${name}: ${id}`).toBeDefined();
    }
  });

  it("common has an iPad mini and the brief's phones", () => {
    const ids = FIXED_PRESETS.common;
    expect(ids).toEqual(expect.arrayContaining(["iphone-se-3", "iphone-16-pro", "galaxy-a16", "pixel-9"]));
    expect(ids.some((id) => getDevice(id)?.name.startsWith("iPad mini"))).toBe(true);
  });

  it("all-sizes picks one device per width bucket, at most 8, from the catalog", () => {
    const picked = allSizesPreset(devices);
    expect(picked.length).toBeGreaterThanOrEqual(5);
    expect(picked.length).toBeLessThanOrEqual(WIDTH_BUCKETS.length);
    for (const device of picked) expect(getDevice(device.id)).toBe(device);
    const widths = picked.map((device) => device.screen.width);
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
    expect(new Set(widths).size).toBe(widths.length);
    // The most common Android width is represented.
    expect(widths).toContain(412);
  });
});

describe("selectDevices", () => {
  it("defaults to the common preset", () => {
    const result = selectDevices({}, devices);
    expect(result.ok && result.devices.map((device) => device.id)).toEqual([...FIXED_PRESETS.common]);
  });

  it("resolves a preset", () => {
    const result = selectDevices({ preset: "phones" }, devices);
    expect(result.ok && result.devices).toHaveLength(FIXED_PRESETS.phones.length);
  });

  it("keeps --devices order and drops duplicates", () => {
    const result = selectDevices({ devices: ["pixel-9", "iphone-se-3", "pixel-9"] }, devices);
    expect(result.ok && result.devices.map((device) => device.id)).toEqual(["pixel-9", "iphone-se-3"]);
  });

  it("suggests the 3 closest ids for an unknown device", () => {
    const result = selectDevices({ devices: ["iphone-16-pr"] }, devices);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions).toContain("iphone-16-pro");
    expect(result.message).toBe(`Unknown device iphone-16-pr. Did you mean: ${result.suggestions.join(", ")}?`);
  });
});

describe("closestIds", () => {
  it("ranks ids containing the input first", () => {
    expect(closestIds("pixel-9", devices)[0]).toBe("pixel-9");
    expect(closestIds("galaxy-a1", devices)).toContain("galaxy-a16");
  });
});
