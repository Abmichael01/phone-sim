import { describe, expect, it } from "vitest";
import type { Issue } from "./issues";
import { BADGE_SIZE, layoutOverlay, overlayHtml, SEVERITY_COLORS } from "./overlay";

describe("overlayHtml", () => {
  it("draws boxes and numbered badges at their page positions", () => {
    const html = overlayHtml({
      boxes: [{ rect: { x: 10, y: 20, width: 30, height: 40 }, color: SEVERITY_COLORS.error }],
      badges: [{ number: 7, x: 4, y: 11, color: SEVERITY_COLORS.error }],
    });
    expect(html).toContain("left:10px;top:20px;width:30px;height:40px;border:2px solid #e5484d");
    expect(html).toContain("left:4px;top:11px;");
    expect(html).toContain(">7</div>");
    expect(html).toContain("pointer-events:none");
  });
});

function issue(number: number, rects: Issue["rects"], severity: Issue["severity"] = "warn"): Issue {
  return {
    number,
    rule: "small-tap-target",
    severity,
    selector: "a",
    group: "nav > a",
    examples: [],
    message: "m",
    hint: "h",
    detail: "",
    rect: rects[0] ?? null,
    rects,
    count: Math.max(1, rects.length),
    onAllDevices: false,
  };
}

const plain = { width: 400, cornerRadius: 0, avoid: [] };

describe("layoutOverlay", () => {
  it("draws a box per rect and one badge per issue, coloured by severity", () => {
    const overlay = layoutOverlay(
      [issue(1, [{ x: 100, y: 100, width: 50, height: 20 }], "error"), issue(2, [{ x: 10, y: 300, width: 30, height: 10 }, { x: 60, y: 300, width: 30, height: 10 }])],
      plain,
    );
    expect(overlay.boxes).toHaveLength(3);
    expect(overlay.badges.map((badge) => [badge.number, badge.color])).toEqual([
      [1, SEVERITY_COLORS.error],
      [2, SEVERITY_COLORS.warn],
    ]);
    expect(overlay.badges[0]).toMatchObject({ x: 94, y: 91 });
  });

  it("skips issues without a position", () => {
    expect(layoutOverlay([issue(1, [])], plain)).toEqual({ boxes: [], badges: [] });
  });

  it("clamps boxes to the screen width", () => {
    const overlay = layoutOverlay([issue(1, [{ x: -20, y: 0, width: 600, height: 10 }])], plain);
    expect(overlay.boxes[0]?.rect).toEqual({ x: 0, y: 0, width: 400, height: 10 });
  });

  it("keeps badges out of rounded corners, cutouts and each other", () => {
    const shape = { width: 402, cornerRadius: 62, avoid: [{ x: 139, y: 11, width: 124, height: 36 }] };
    const overlay = layoutOverlay(
      [
        issue(1, [{ x: 0, y: 0, width: 402, height: 40 }]),
        issue(2, [{ x: 0, y: 0, width: 402, height: 40 }]),
        issue(3, [{ x: 150, y: 20, width: 20, height: 20 }]),
      ],
      shape,
    );
    const [first, second, third] = overlay.badges;
    expect(first?.x).toBeGreaterThan(20);
    expect(second && first && Math.abs(second.x - first.x)).toBeGreaterThanOrEqual(BADGE_SIZE);
    // Moved below the Dynamic Island.
    expect(third?.y).toBeGreaterThanOrEqual(11 + 36);
  });
});
