import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { AdessoHubClient } from "./hubClient";
import { mapModels, dryRunSummary } from "./mapping";
import { ensureProviders } from "./writer";

function requireKey(): string {
  const key = process.env.ADESSO_API_KEY;
  if (!key) {
    throw new Error("Missing ADESSO_API_KEY. Set env var and retry.");
  }
  return key;
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("update-adesso", {
    description: "Update pi providers/models from Adesso AI Hub",
    handler: async (args, ctx) => {
      const key = requireKey();
      const baseUrl = "https://adesso-ai-hub.3asabc.de";
      const client = new AdessoHubClient(baseUrl, key);

      const dryRun = /--dry-run\b/.test(args || "");

      // fetch
      const info = (await client.getModelInfo()) as any[];
      const providers = mapModels(info);

      if (dryRun) {
        const summary = dryRunSummary(providers);
        ctx.ui.notify(summary, "info");
        return;
      }

      // write
      const modelsPath = `${process.env.HOME || "~"}/.pi/agent/models.json`;
      await ensureProviders(modelsPath, providers);
      ctx.ui.notify("providers updated", "success");
    },
  });

  pi.registerCommand("spend", {
    description: "Show Today/MTD spend from Adesso AI Hub",
    handler: async (_args, ctx) => {
      const key = requireKey();
      const baseUrl = "https://adesso-ai-hub.3asabc.de";
      const client = new AdessoHubClient(baseUrl, key);

      // Dates in UTC
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = now.getUTCMonth();
      const d = now.getUTCDate();
      const today = new Date(Date.UTC(y, m, d));
      const firstOfMonth = new Date(Date.UTC(y, m, 1));
      const fmt = (dt: Date) => dt.toISOString().slice(0, 10);

      const daily = await client.getUserDailyActivity(fmt(today), fmt(today));
      const mtd = await client.getUserDailyActivity(fmt(firstOfMonth), fmt(today));

      // permissive field mapping
      const sum = (x: any): number => {
        if (Array.isArray(x)) return x.reduce((acc, it) => acc + (Number(it?.spend ?? it?.cost ?? 0) || 0), 0);
        if (typeof x === "object" && x) {
          if (typeof (x as any).total === "number") return (x as any).total;
          if (typeof (x as any).spend === "number") return (x as any).spend;
          if (typeof (x as any).cost === "number") return (x as any).cost;
        }
        return Number(x) || 0;
      };

      const todayVal = Math.round(sum(daily) * 100) / 100;
      const mtdVal = Math.round(sum(mtd) * 100) / 100;
      ctx.ui.notify(`Today ${todayVal.toFixed(2)} • Month ${mtdVal.toFixed(2)}`, "info");
    },
  });
}
