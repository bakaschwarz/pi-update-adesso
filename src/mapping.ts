// Mapping + routing (dry-run)
export interface ModelInfoItem {
  model_name: string;
  model_info?: {
    supports_reasoning?: boolean;
    supports_vision?: boolean;
    max_input_tokens?: number;
    max_output_tokens?: number;
    max_tokens?: number;
    input_cost_per_token?: number; // per token in currency units → we will scale ×1e6 below if needed
    output_cost_per_token?: number;
    cache_read_input_token_cost?: number;
    cache_creation_input_token_cost?: number;
    cache_creation_input_token_cost_above_200k_tokens?: number;
    mode?: "chat" | "responses" | "embeddings" | string;
  };
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
    // Skip models without model_info
    if (!m.model_info) continue;
    
    // Exclude embeddings
    if (m.model_info.mode === "embeddings") continue;

    const id = m.model_name;
    const name = id;
    const reasoning = !!m.model_info.supports_reasoning;
    const input: PiModel["input"] = ["text", ...(m.model_info.supports_vision ? ["image"] : []) as ("image"|"text")[]];
    const contextWindow = m.model_info.max_input_tokens ?? m.model_info.max_tokens ?? 128000;
    const maxTokens = m.model_info.max_output_tokens ?? m.model_info.max_tokens ?? 4096;

    // Values are converted from per-token to per-million-tokens
    const inputCost = Math.round((m.model_info.input_cost_per_token ?? 0) * 1_000_000);
    const outputCost = Math.round((m.model_info.output_cost_per_token ?? 0) * 1_000_000);
    const cacheReadCost = Math.round((m.model_info.cache_read_input_token_cost ?? 0) * 1_000_000);
    const cacheWriteCost = Math.round(((m.model_info.cache_creation_input_token_cost_above_200k_tokens ?? m.model_info.cache_creation_input_token_cost) ?? 0) * 1_000_000);

    const model: PiModel = {
      id,
      name,
      reasoning,
      input,
      cost: { input: inputCost, output: outputCost, cacheRead: cacheReadCost, cacheWrite: cacheWriteCost },
      contextWindow,
      maxTokens,
    };

    if (m.model_info.mode === "responses") {
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
