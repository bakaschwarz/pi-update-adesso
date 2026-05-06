// Mapping + routing (dry-run)
export interface ModelInfoItem {
  model_name: string;
  supports_reasoning?: boolean;
  supports_vision?: boolean;
  max_input_tokens?: number;
  max_output_tokens?: number;
  max_tokens?: number;
  input_price_micro?: number; // per token in currency units → we will scale ×1e6 below if needed
  output_price_micro?: number;
  mode?: "chat" | "responses" | "embeddings" | string;
}

export interface PiModel {
  id: string;
  name: string;
  reasoning: boolean;
  input: Array<"text" | "image">;
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow: number;
  maxTokens: number;
  api?: string; // override per-model when mode=responses
}

export interface ProviderModels {
  provider: "adesso-openai" | "adesso-anthropic";
  models: PiModel[];
}

export function mapModels(payload: ModelInfoItem[]): ProviderModels[] {
  const out: Record<string, PiModel[]> = {
    "adesso-openai": [],
    "adesso-anthropic": [],
  };

  for (const m of payload) {
    // Exclude embeddings
    if (m.mode === "embeddings") continue;

    const id = m.model_name;
    const name = id;
    const reasoning = !!m.supports_reasoning;
    const input: PiModel["input"] = ["text", ...(m.supports_vision ? ["image"] : []) as ("image"|"text")[]];
    const contextWindow = m.max_input_tokens ?? m.max_tokens ?? 128000;
    const maxTokens = m.max_output_tokens ?? m.max_tokens ?? 4096;

    // Values are already in micro-units, no scaling needed
    const inputCost = Math.round(m.input_price_micro ?? 0);
    const outputCost = Math.round(m.output_price_micro ?? 0);

    const model: PiModel = {
      id,
      name,
      reasoning,
      input,
      cost: { input: inputCost, output: outputCost, cacheRead: 0, cacheWrite: 0 },
      contextWindow,
      maxTokens,
    };

    if (m.mode === "responses") {
      // per-model api override
      model.api = "openai-responses";
    }

    const isAnthropic = /claude|anthropic/i.test(id);
    const provider = isAnthropic ? "adesso-anthropic" : "adesso-openai";
    out[provider].push(model);
  }

  return [
    { provider: "adesso-openai", models: out["adesso-openai"] },
    { provider: "adesso-anthropic", models: out["adesso-anthropic"] },
  ];
}

export function dryRunSummary(providers: ProviderModels[]): string {
  const parts: string[] = [];
  for (const p of providers) {
    parts.push(`${p.provider}: ${p.models.length} models`);
    const sample = p.models.slice(0, 3).map(m => m.id).join(", ");
    if (sample) parts.push(`  sample: ${sample}`);
  }
  return parts.join("\n");
}
