export default function (pi) {
  function requireKey() {
    const key = process.env.ADESSO_API_KEY;
    if (!key) {
      throw new Error("Missing ADESSO_API_KEY. Set env var and retry.");
    }
    return key;
  }

  pi.registerCommand("update-adesso", {
    description: "Update pi providers/models from Adesso AI Hub",
    handler: async (_args, ctx) => {
      requireKey();
      ctx.ui?.notify?.("update-adesso started", "info");
      ctx.ui?.notify?.("update-adesso finished (stub)", "success");
    },
  });

  pi.registerCommand("spend", {
    description: "Show Today/MTD spend from Adesso AI Hub",
    handler: async (_args, ctx) => {
      requireKey();
      ctx.ui?.notify?.("spend started", "info");
      ctx.ui?.notify?.("Today .00 • Month .00 (stub)", "info");
    },
  });
}
