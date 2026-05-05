import initExtension from "../src/index";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("pi-update-adesso scaffold", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    // Save and clear env for tests that require missing key
    originalKey = process.env.ADESSO_API_KEY;
    delete process.env.ADESSO_API_KEY;
  });

  afterEach(() => {
    // Restore env
    if (originalKey !== undefined) process.env.ADESSO_API_KEY = originalKey;
    else delete process.env.ADESSO_API_KEY;
  });

  it("registers /update-adesso and /spend commands", () => {
    const commands: Record<string, any> = {};
    const pi = {
      registerCommand: (name: string, def: any) => (commands[name] = def),
    } as any;

    initExtension(pi);

    expect(Object.keys(commands).sort()).toEqual([
      "spend",
      "update-adesso",
    ]);
    expect(commands["update-adesso"]).toBeDefined();
    expect(typeof commands["update-adesso"].handler).toBe("function");
    expect(commands["spend"]).toBeDefined();
    expect(typeof commands["spend"].handler).toBe("function");
  });

  it("throws when ADESSO_API_KEY is missing (env key error)", async () => {
    const commands: Record<string, any> = {};
    const pi = {
      registerCommand: (name: string, def: any) => (commands[name] = def),
    } as any;

    initExtension(pi);

    const ctx = { ui: { notify: vi.fn() } } as any;

    await expect(commands["update-adesso"].handler({}, ctx)).rejects.toThrow(
      /Missing ADESSO_API_KEY/
    );
    await expect(commands["spend"].handler({}, ctx)).rejects.toThrow(
      /Missing ADESSO_API_KEY/
    );
  });
});
