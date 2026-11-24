import { describe, expect, it } from "vitest";
import { canGoBack, canGoForward, EMPTY_HISTORY, recordNavigation, requestTraverse } from "./frameHistory";

const A = "https://a.test/";
const B = "https://a.test/b";
const C = "https://a.test/c";

describe("frame history", () => {
  it("starts with the first page and cannot go back", () => {
    const history = recordNavigation(EMPTY_HISTORY, A, "load");
    expect(history.entries).toEqual([A]);
    expect(canGoBack(history)).toBe(false);
  });

  it("pushes new pages and follows a requested back / forward", () => {
    let history = recordNavigation(EMPTY_HISTORY, A, "load");
    history = recordNavigation(history, B, "load");
    history = recordNavigation(history, C, "push");
    expect(history.index).toBe(2);
    history = recordNavigation(requestTraverse(history, "back"), B, "load");
    expect(history.index).toBe(1);
    expect(canGoBack(history) && canGoForward(history)).toBe(true);
    history = recordNavigation(requestTraverse(history, "forward"), C, "pop");
    expect(history.index).toBe(2);
    expect(canGoForward(history)).toBe(false);
  });

  it("replaces on replaceState and ignores duplicate reports", () => {
    let history = recordNavigation(EMPTY_HISTORY, A, "load");
    history = recordNavigation(history, B, "replace");
    history = recordNavigation(history, B, "pop");
    expect(history).toEqual({ entries: [B], index: 0, pending: null });
  });

  it("detects the site's own back navigation and drops forward entries on a new page", () => {
    let history = recordNavigation(EMPTY_HISTORY, A, "load");
    history = recordNavigation(history, B, "push");
    history = recordNavigation(history, A, "pop");
    expect(history.index).toBe(0);
    history = recordNavigation(history, C, "load");
    expect(history.entries).toEqual([A, C]);
  });
});
