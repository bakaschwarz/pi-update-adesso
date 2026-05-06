import { describe, it, expect } from "vitest";
import { mapModels, dryRunSummary, type ModelInfoItem } from "../src/mapping";

describe("mapping", () => {
  const sample: ModelInfoItem[] = [
    { model_name: "gpt-4o-mini", supports_reasoning: false, supports_vision: true, max_tokens: 100000, mode: "chat", input_price_micro: 3, output_price_micro: 15 },
    { model_name: "claude-3-5-sonnet", supports_reasoning: true, supports_vision: true, max_input_tokens: 200000, max_output_tokens: 8000, mode: "chat", input_price_micro: 5, output_price_micro: 15 },
    { model_name: "text-embedding-3-small", mode: "embeddings" },
    { model_name: "o3-mini", supports_reasoning: true, max_tokens: 50000, mode: "responses", input_price_micro: 2, output_price_micro: 10 },
  ];

  it("maps to providers, excludes embeddings, sets overrides", () => {
    const providers = mapModels(sample);
    const openai = providers.find(p => p.provider === "adesso-openai")!;
    const anth = providers.find(p => p.provider === "adesso-anthropic")!;

    expect(openai.models.find(m => m.id === "gpt-4o-mini")).toBeTruthy();
    expect(openai.models.find(m => m.id === "o3-mini")?.api).toBe("openai-responses");
    expect(anth.models.find(m => m.id === "claude-3-5-sonnet")).toBeTruthy();
    expect(openai.models.find(m => m.id === "text-embedding-3-small")).toBeFalsy();

    const gpt4o = openai.models.find(m => m.id === "gpt-4o-mini")!;
    expect(gpt4o.input).toContain("image");
    expect(gpt4o.reasoning).toBe(false);
  });

  it("correctly maps cost values without double scaling", () => {
    const providers = mapModels(sample);
    const openai = providers.find(p => p.provider === "adesso-openai")!;
    const anth = providers.find(p => p.provider === "adesso-anthropic")!;

    const gpt4o = openai.models.find(m => m.id === "gpt-4o-mini")!;
    expect(gpt4o.cost.input).toBe(3);  // input_price_micro: 3 should remain 3
    expect(gpt4o.cost.output).toBe(15);  // output_price_micro: 15 should remain 15

    const claude = anth.models.find(m => m.id === "claude-3-5-sonnet")!;
    expect(claude.cost.input).toBe(5);  // input_price_micro: 5 should remain 5
    expect(claude.cost.output).toBe(15);  // output_price_micro: 15 should remain 15

    const o3mini = openai.models.find(m => m.id === "o3-mini")!;
    expect(o3mini.cost.input).toBe(2);  // input_price_micro: 2 should remain 2
    expect(o3mini.cost.output).toBe(10);  // output_price_micro: 10 should remain 10
  });

  it("dry-run summary prints counts and samples", () => {
    const providers = mapModels(sample);
    const s = dryRunSummary(providers);
    expect(s).toMatch(/adesso-openai: 2/);
    expect(s).toMatch(/adesso-anthropic: 1/);
  });
});
