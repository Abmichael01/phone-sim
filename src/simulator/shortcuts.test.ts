import { describe, expect, it } from "vitest";
import { shortcutFor, type KeyLike } from "./shortcuts";

const key = (code: string, key: string, mods: Partial<KeyLike> = {}): KeyLike => ({
  code,
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe("shortcutFor", () => {
  it("maps plain keys", () => {
    expect(shortcutFor(key("KeyD", "d"))).toBe("devices");
    expect(shortcutFor(key("KeyA", "a"))).toBe("add-device");
    expect(shortcutFor(key("KeyB", "b"))).toBe("backgrounds");
    expect(shortcutFor(key("KeyR", "r"))).toBe("rotate");
    expect(shortcutFor(key("KeyY", "y"))).toBe("sync-scroll");
    expect(shortcutFor(key("BracketLeft", "["))).toBe("prev-device");
    expect(shortcutFor(key("BracketRight", "]"))).toBe("next-device");
    expect(shortcutFor(key("KeyS", "s"))).toBe("screenshot");
    expect(shortcutFor(key("KeyV", "v"))).toBe("record");
    expect(shortcutFor(key("KeyF", "f"))).toBe("zoom-fit");
    expect(shortcutFor(key("Digit2", "2"))).toBe("zoom-75");
  });

  it("maps modified keys", () => {
    expect(shortcutFor(key("KeyS", "S", { shiftKey: true }))).toBe("screenshot-screen");
    expect(shortcutFor(key("KeyL", "l", { ctrlKey: true }))).toBe("edit-url");
    expect(shortcutFor(key("KeyL", "l", { metaKey: true }))).toBe("edit-url");
    expect(shortcutFor(key("ArrowLeft", "ArrowLeft", { altKey: true }))).toBe("back");
    expect(shortcutFor(key("ArrowRight", "ArrowRight", { altKey: true }))).toBe("forward");
  });

  it("leaves browser shortcuts and unknown keys alone", () => {
    expect(shortcutFor(key("KeyR", "r", { ctrlKey: true }))).toBeNull();
    expect(shortcutFor(key("KeyD", "D", { shiftKey: true }))).toBeNull();
    expect(shortcutFor(key("KeyQ", "q"))).toBeNull();
    expect(shortcutFor(key("ArrowLeft", "ArrowLeft"))).toBeNull();
  });
});
