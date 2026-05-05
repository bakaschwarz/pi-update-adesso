import { describe, it, expect } from "vitest";
import { ensureProviders } from "../src/writer";
import { promises as fs } from "node:fs";
import path from "node:path";

async function readJson(p: string) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

describe("writer", () => {
  it("creates backup and writes providers, preserving others", async () => {
    const dir = await fs.mkdtemp("/tmp/models-json-");
    const file = path.join(dir, "models.json");

    // seed with other provider
    await fs.writeFile(file, JSON.stringify({ providers: { local: { baseUrl: "http://x", api: "openai-completions", apiKey: "LOCAL", authHeader: false, models: [{ id: "foo" }] } } }, null, 2));

    await ensureProviders(file, [
      { provider: "adesso-openai", models: [{ id: "m1" }] },
      { provider: "adesso-anthropic", models: [{ id: "c1" }] },
    ]);

    const data = await readJson(file);
    expect(data.providers.local).toBeTruthy();
    expect(data.providers["adesso-openai"].apiKey).toBe("ADESSO_API_KEY");
    expect(data.providers["adesso-openai"].models).toEqual([{ id: "m1" }]);

    // backup exists
    const entries = await fs.readdir(dir);
    expect(entries.some((n) => /models.json\..+\.bak$/.test(n))).toBe(true);
  });
});
