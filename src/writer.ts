import { promises as fs } from "node:fs";
import path from "node:path";

export interface ProviderConfig {
  baseUrl: string;
  api: string;
  apiKey: string;
  authHeader: boolean;
  models: any[];
}

export interface ModelsJson {
  providers: Record<string, ProviderConfig>;
}

export async function ensureProviders(modelsPath: string, providerModels: Array<{ provider: string; models: any[] }>): Promise<void> {
  // Load or init
  let data: ModelsJson = { providers: {} };
  try {
    const raw = await fs.readFile(modelsPath, "utf8");
    data = JSON.parse(raw);
    if (!data.providers || typeof data.providers !== "object") data.providers = {} as any;
  } catch (e: any) {
    if (e.code !== "ENOENT") throw e;
  }

  // Backup
  await backupFile(modelsPath);

  // Ensure adesso providers
  for (const pm of providerModels) {
    const key = pm.provider;
    const existing = data.providers[key] ?? {} as ProviderConfig;

    const baseUrl = key === "adesso-anthropic" ? "https://adesso-ai-hub.3asabc.de/anthropic" : "https://adesso-ai-hub.3asabc.de/openai";
    const api = key === "adesso-anthropic" ? "anthropic-messages" : "openai-completions";

    data.providers[key] = {
      baseUrl,
      api,
      apiKey: "ADESSO_API_KEY",
      authHeader: true,
      models: pm.models, // hard-replace
    };

    // Preserve non-adesso providers implicitly by not touching other keys
    for (const k of Object.keys(data.providers)) {
      if (k !== "adesso-openai" && k !== "adesso-anthropic") {
        // leave as-is
        data.providers[k] = data.providers[k];
      }
    }
  }

  // Write pretty
  await fs.mkdir(path.dirname(modelsPath), { recursive: true });
  await fs.writeFile(modelsPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function backupFile(filePath: string): Promise<void> {
  try {
    const raw = await fs.readFile(filePath);
    const dir = path.dirname(filePath);
    const name = path.basename(filePath);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `${name}.${ts}.bak`;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, backupName), raw);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      // Nothing to backup yet
      return;
    }
    throw e;
  }
}
