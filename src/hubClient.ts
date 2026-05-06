export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface HubClientOptions {
    timeoutMs?: number;
    fetchImpl?: FetchLike;
}

export class AdessoHubError extends Error {
    code: string;
    status?: number;
    constructor(code: string, message: string, status?: number) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

export interface ModelInfoResponse {
    data: any[];
}

export interface DailyActivityResponse {
    metadata: {
        total_spend: number;
    };
}

export class AdessoHubClient {
    private baseUrl: string;
    private apiKey: string;
    private timeoutMs: number;
    private fetchImpl: FetchLike;

    constructor(baseUrl: string, apiKey: string, options: HubClientOptions = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
        this.timeoutMs = options.timeoutMs ?? 15000;
        this.fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
        if (!this.fetchImpl) throw new Error("fetch not available; provide fetchImpl in options");
    }

    async getModelInfo(): Promise<ModelInfoResponse> {
        return this.getJson("/v1/model/info") as Promise<ModelInfoResponse>;
    }

    async getUserDailyActivity(startDate: string, endDate: string): Promise<DailyActivityResponse> {
        const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
        return this.getJson(`/user/daily/activity?${qs.toString()}`) as Promise<DailyActivityResponse>;
    }

    private async getJson(path: string): Promise<unknown> {
        const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), this.timeoutMs);
        try {
            const res = await this.fetchImpl(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    Accept: "application/json",
                },
                signal: ac.signal,
            });

            if (res.status === 401 || res.status === 403) {
                throw new AdessoHubError("unauthorized", "unauthorized", res.status);
            }
            if (!res.ok) {
                const text = await safeText(res);
                const code = res.status >= 500 ? "server_error" : "http_error";
                throw new AdessoHubError(code, `${res.status} ${res.statusText}${text ? ": " + text : ""}`, res.status);
            }
            // 2xx
            const ct = res.headers.get("content-type") || "";
            if (!/application\/json/i.test(ct)) {
                const txt = await res.text().catch(() => "");
                throw new AdessoHubError(
                    "invalid_json",
                    `expected application/json, got '${ct || ""}'${txt ? "; body=" + txt : ""}`,
                );
            }
            return await res.json();
        } catch (err: unknown) {
            if (err instanceof AdessoHubError) throw err;
            if ((err as any)?.name === "AbortError") {
                throw new AdessoHubError("timeout", "request timed out");
            }
            // Surface network and other errors
            const e = err as Error;
            throw new AdessoHubError("network_error", e.message || String(e));
        } finally {
            clearTimeout(t);
        }
    }
}

async function safeText(res: Response): Promise<string | undefined> {
    try {
        const txt = await res.text();
        return txt && txt.length > 0 ? txt.slice(0, 500) : undefined;
    } catch {
        return undefined;
    }
}
