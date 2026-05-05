import { describe, it, expect } from "vitest";
import { AdessoHubClient, AdessoHubError } from "../src/hubClient";

describe("AdessoHubClient", () => {
  const baseUrl = "https://adesso-ai-hub.3asabc.de";

  it("parses JSON on 200", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    const c = new AdessoHubClient(baseUrl, "k", { fetchImpl });
    const data = await c.getModelInfo();
    expect(data).toEqual({ ok: true });
  });

  it("maps 401/403 to unauthorized", async () => {
    for (const status of [401, 403]) {
      const fetchImpl = async () => new Response("", { status });
      const c = new AdessoHubClient(baseUrl, "k", { fetchImpl });
      await expect(c.getModelInfo()).rejects.toMatchObject({ code: "unauthorized", status });
    }
  });

  it("surfaces network error", async () => {
    const fetchImpl = async () => { throw new Error("boom"); };
    const c = new AdessoHubClient(baseUrl, "k", { fetchImpl });
    await expect(c.getModelInfo()).rejects.toMatchObject({ code: "network_error" });
  });

  it("times out", async () => {
    const fetchImpl = async () => new Promise<Response>(() => {});
    const c = new AdessoHubClient(baseUrl, "k", { fetchImpl, timeoutMs: 10 });
    await expect(c.getModelInfo()).rejects.toMatchObject({ code: "timeout" });
  });
});
