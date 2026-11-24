import { describe, expect, it } from "vitest";
import { getDevice } from "@/devices";
import type { Device } from "@/schemas/device";
import { mapLimit } from "./pool";
import { describeLoadError, jobsFor, pngSize } from "./run";

function device(id: string): Device {
  const found = getDevice(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe("jobsFor", () => {
  it("adds a landscape job per device when asked", () => {
    const list = [device("pixel-9"), device("iphone-se-3")];
    expect(jobsFor(list, false).map((job) => job.base)).toEqual(["pixel-9", "iphone-se-3"]);
    expect(jobsFor(list, true).map((job) => `${job.base}:${job.orientation}`)).toEqual([
      "pixel-9:portrait",
      "pixel-9-landscape:landscape",
      "iphone-se-3:portrait",
      "iphone-se-3-landscape:landscape",
    ]);
  });
});

describe("pngSize", () => {
  it("reads width and height from the PNG header", () => {
    const header = new Uint8Array(24);
    header.set([0x89, 0x50, 0x4e, 0x47]);
    new DataView(header.buffer).setUint32(16, 1206);
    new DataView(header.buffer).setUint32(20, 2622);
    expect(pngSize(header)).toEqual({ width: 1206, height: 2622 });
    expect(pngSize(new Uint8Array(4))).toEqual({ width: 0, height: 0 });
  });
});

describe("describeLoadError", () => {
  const url = "http://localhost:3000/";

  it("explains a server that is not running", () => {
    const error = describeLoadError(new Error("page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/"), url, 30000);
    expect(error.message).toBe("Nothing is answering at http://localhost:3000/.");
    expect(error.next).toBe("Start your dev server, then run: npx phone-sim check http://localhost:3000/");
  });

  it("suggests a longer timeout", () => {
    const error = describeLoadError(new Error("page.goto: Timeout 30000ms exceeded."), url, 30000);
    expect(error.message).toBe("The page did not finish loading within 30s.");
    expect(error.next).toBe("npx phone-sim check http://localhost:3000/ --timeout 60000");
  });

  it("handles unknown hosts, missing files and anything else", () => {
    expect(describeLoadError(new Error("net::ERR_NAME_NOT_RESOLVED"), "https://exampel.com/", 1000).message).toContain("exampel.com");
    expect(describeLoadError(new Error("net::ERR_FILE_NOT_FOUND"), "file:///tmp/x.html", 1000).message).toBe("File not found: /tmp/x.html");
    expect(describeLoadError(new Error("page.goto: something odd\nstack"), url, 1000).message).toBe("Could not open http://localhost:3000/: something odd");
  });
});

describe("mapLimit", () => {
  it("keeps order and never runs more than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    const results = await mapLimit([5, 1, 4, 2, 3, 0], 2, async (value) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, value));
      running -= 1;
      return value * 10;
    });
    expect(results).toEqual([50, 10, 40, 20, 30, 0]);
    expect(peak).toBe(2);
  });

  it("handles an empty list", async () => {
    expect(await mapLimit([], 4, async () => 1)).toEqual([]);
  });
});
