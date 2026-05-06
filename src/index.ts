import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { AdessoHubClient, ModelInfoResponse, DailyActivityResponse } from "./hubClient";
import { mapModels, dryRunSummary } from "./mapping";
import { ensureProviders } from "./writer";
import os from "node:os";
import path from "node:path";

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
            const response = (await client.getModelInfo()) as ModelInfoResponse;
            const providers = mapModels(response.data);

            if (dryRun) {
                const summary = dryRunSummary(providers);
                ctx.ui.notify(summary, "info");
                return;
            }

            // write
            const modelsPath = path.join(os.homedir(), ".pi", "agent", "models.json");
            await ensureProviders(modelsPath, providers);
            ctx.ui.notify("providers updated", "info");
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

            const daily = await client.getUserDailyActivity(fmt(today), fmt(today)) as DailyActivityResponse;
            const mtd = await client.getUserDailyActivity(fmt(firstOfMonth), fmt(today)) as DailyActivityResponse;

            const todayVal = Math.round(daily.metadata.total_spend * 100) / 100;
            const mtdVal = Math.round(mtd.metadata.total_spend * 100) / 100;
            ctx.ui.notify(`Today ${todayVal.toFixed(2)} • Month ${mtdVal.toFixed(2)}`, "info");
        },
    });
}
