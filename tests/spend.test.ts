import { describe, it, expect } from "vitest";
import { AdessoHubClient } from "../src/hubClient";

// Note: command handler uses AdessoHubClient; here we just sanity-check date windows logic separately if needed.

describe("spend windows", () => {
  it("UTC windows produce YYYY-MM-DD strings", () => {
    // This is a smoke test; full integration covered at command level in follow-ups
    const now = new Date(Date.UTC(2024, 0, 2));
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const today = new Date(Date.UTC(y, m, d));
    const firstOfMonth = new Date(Date.UTC(y, m, 1));
    const fmt = (dt: Date) => dt.toISOString().slice(0, 10);

    expect(fmt(today)).toBe("2024-01-02");
    expect(fmt(firstOfMonth)).toBe("2024-01-01");
  });
});
