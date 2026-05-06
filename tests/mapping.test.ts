import { describe, it, expect } from "vitest";
import { mapModels, dryRunSummary, type ModelInfoItem } from "../src/mapping";

describe("mapping", () => {
  const sample: ModelInfoItem[] = [
    { model_name: "gpt-4o-mini", model_info: { supports_reasoning: false, supports_vision: true, max_tokens: 100000, mode: "chat", input_cost_per_token: 0.000003, output_cost_per_token: 0.000015 } },
    { model_name: "claude-3-5-sonnet", model_info: { supports_reasoning: true, supports_vision: true, max_input_tokens: 200000, max_output_tokens: 8000, mode: "chat", input_cost_per_token: 0.000005, output_cost_per_token: 0.000015, cache_read_input_token_cost: 0.00000075, cache_creation_input_token_cost: 0.0000015 } },
    { model_name: "claude-3-haiku", model_info: { supports_reasoning: false, supports_vision: false, max_input_tokens: 200000, max_output_tokens: 4096, mode: "chat", input_cost_per_token: 0.00000025, output_cost_per_token: 0.00000125, cache_read_input_token_cost: 0.000001, cache_creation_input_token_cost_above_200k_tokens: 0.0000005 } },
    { model_name: "text-embedding-3-small", model_info: { mode: "embeddings" } },
    { model_name: "o3-mini", model_info: { supports_reasoning: true, max_tokens: 50000, mode: "responses", input_cost_per_token: 0.000002, output_cost_per_token: 0.000010 } },
    // Model without model_info should be skipped
    { model_name: "invalid-model" },
  ];

  it("correctly maps cache cost values with proper scaling", () => {
    const providers = mapModels(sample);
    const anth = providers.find(p => p.provider === "adesso-anthropic")!;

    const claudeSonnet = anth.models.find(m => m.id === "claude-3-5-sonnet")!;
    expect(claudeSonnet.cost.cacheRead).toBe(0.75);  // cache_read_input_token_cost: 0.00000075 should become 0.75
    expect(claudeSonnet.cost.cacheWrite).toBe(1.5);  // cache_creation_input_token_cost: 0.0000015 should become 1.5

    const claudeHaiku = anth.models.find(m => m.id === "claude-3-haiku")!;
    expect(claudeHaiku.cost.cacheRead).toBe(1);  // cache_read_input_token_cost: 0.000001 should become 1
    expect(claudeHaiku.cost.cacheWrite).toBe(0.5);  // cache_creation_input_token_cost_above_200k_tokens: 0.0000005 should become 0.5
  });

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

  it("correctly maps cost values with proper scaling", () => {
    const providers = mapModels(sample);
    const openai = providers.find(p => p.provider === "adesso-openai")!;
    const anth = providers.find(p => p.provider === "adesso-anthropic")!;

    const gpt4o = openai.models.find(m => m.id === "gpt-4o-mini")!;
    expect(gpt4o.cost.input).toBe(3);  // input_cost_per_token: 0.000003 should become 3
    expect(gpt4o.cost.output).toBe(15);  // output_cost_per_token: 0.000015 should become 15

    const claude = anth.models.find(m => m.id === "claude-3-5-sonnet")!;
    expect(claude.cost.input).toBe(5);  // input_cost_per_token: 0.000005 should become 5
    expect(claude.cost.output).toBe(15);  // output_cost_per_token: 0.000015 should become 15

    const o3mini = openai.models.find(m => m.id === "o3-mini")!;
    expect(o3mini.cost.input).toBe(2);  // input_cost_per_token: 0.000002 should become 2
    expect(o3mini.cost.output).toBe(10);  // output_cost_per_token: 0.000010 should become 10
  });

  it("dry-run summary prints counts and samples", () => {
    const providers = mapModels(sample);
    const s = dryRunSummary(providers);
    expect(s).toMatch(/adesso-openai: 2/);
    expect(s).toMatch(/adesso-anthropic: 2/);
  });
});
