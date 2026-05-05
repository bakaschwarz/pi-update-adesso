import { describe, it, expect } from "vitest";
import { mapModels, dryRunSummary } from "../src/mapping";
import { ensureProviders } from "../src/writer";
import { promises as fs } from "node:fs";
import path from "node:path";

describe("/update-adesso e2e (logic units)", () => {
  it("dry-run prints counts and sample ids; real write idempotent", async () => {
    const payload = [
      { model_name: "gpt-4o-mini", supports_vision: true, mode: "chat" },
      { model_name: "claude-3-5-sonnet", supports_reasoning: true, supports_vision: true, mode: "chat" },
    ];

    const providers = mapModels(payload as any);
    const summary = dryRunSummary(providers);
    expect(summary).toMatch(/adesso-openai: 1/);
    expect(summary).toMatch(/adesso-anthropic: 1/);

    const dir = await fs.mkdtemp("/tmp/models-json-");
    const file = path.join(dir, "models.json");

    await ensureProviders(file, providers);
    const first = await fs.readFile(file, "utf8");
    await ensureProviders(file, providers);
    const second = await fs.readFile(file, "utf8");
    expect(second).toEqual(first);
  });
});
