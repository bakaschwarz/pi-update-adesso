import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function requireKey(): string {
  const key = process.env.ADESSO_API_KEY;
  if (!key) {
    throw new Error("Missing ADESSO_API_KEY. Set env var and retry.");
  }
  return key;
}

export default function (pi: ExtensionAPI) {
  // Register /update-adesso command
  pi.registerCommand("update-adesso", {
    description: "Update pi providers/models from Adesso AI Hub",
    handler: async (_args, ctx) => {
      // No AI usage in handlers
      requireKey();
      ctx.ui?.notify?.("update-adesso started", "info");
      // Stub: real logic in follow-up issues
      ctx.ui?.notify?.("update-adesso finished (stub)", "success");
    },
  });

  // Register /spend command
  pi.registerCommand("spend", {
    description: "Show Today/MTD spend from Adesso AI Hub",
    handler: async (_args, ctx) => {
      requireKey();
      ctx.ui?.notify?.("spend started", "info");
      // Stub: real logic in follow-up issues
      ctx.ui?.notify?.("Today .00 • Month .00 (stub)", "info");
    },
  });
}
