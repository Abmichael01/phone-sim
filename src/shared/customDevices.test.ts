import { describe, expect, it } from "vitest";
import { getDevice } from "@/devices";
import { buildCustomDevice, customDeviceFormSchema, customDeviceToForm, newCustomDeviceId } from "@/schemas/customDevice";
import { parseCustomDevices } from "./customDevices";

const form = {
  name: "Test Phone",
  width: "390",
  height: "844",
  dpr: "3",
  platform: "android",
  kind: "phone",
  cutout: "punch-hole-center",
  screenRadius: "30",
  color: "#334455",
};

describe("custom device form", () => {
  it("coerces and accepts a valid form", () => {
    const parsed = customDeviceFormSchema.parse(form);
    expect(parsed).toMatchObject({ name: "Test Phone", width: 390, height: 844, dpr: 3, screenRadius: 30 });
  });

  it("reports field errors", () => {
    const result = customDeviceFormSchema.safeParse({ ...form, name: " ", width: "900", height: "abc", color: "red" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["name", "height", "color"]));
  });

  it("requires portrait size and iPadOS tablets", () => {
    expect(customDeviceFormSchema.safeParse({ ...form, width: "900", height: "400" }).success).toBe(false);
    expect(customDeviceFormSchema.safeParse({ ...form, platform: "ipados" }).success).toBe(false);
    expect(customDeviceFormSchema.safeParse({ ...form, platform: "ipados", kind: "tablet" }).success).toBe(true);
  });

  it("builds a custom device that never clashes with the catalog", () => {
    const id = newCustomDeviceId("Test Phone!", 1_700_000_000_000);
    expect(id).toMatch(/^custom-test-phone-[a-z0-9]+$/);
    expect(getDevice(id)).toBeUndefined();
    const device = buildCustomDevice(customDeviceFormSchema.parse(form), id, 2026);
    expect(device).toMatchObject({ id, brand: "Custom", platform: "android", screen: { width: 390, height: 844 } });
    expect(customDeviceToForm(device)).toEqual(form);
  });

  it("makes an id even from a name without letters", () => {
    expect(newCustomDeviceId("!!!", 35)).toBe("custom-z");
  });
});

describe("parseCustomDevices", () => {
  const valid = buildCustomDevice(customDeviceFormSchema.parse(form), "custom-a-1", 2026);

  it("keeps valid entries and drops the rest one by one", () => {
    const catalogDevice = getDevice("pixel-8");
    const list = parseCustomDevices([valid, { ...valid, id: "custom-a-2" }, { ...valid, id: "custom-a-1" }, catalogDevice, { id: "custom-x" }, 3]);
    expect(list.map((device) => device.id)).toEqual(["custom-a-1", "custom-a-2"]);
  });

  it("returns an empty list for anything that is not a list", () => {
    expect(parseCustomDevices(undefined)).toEqual([]);
    expect(parseCustomDevices({ 0: valid })).toEqual([]);
  });
});
