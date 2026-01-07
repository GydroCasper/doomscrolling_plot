import { fetch } from "undici";

export async function fetchHtml(
    url: string,
    opts?: { headers?: Record<string, string>; timeoutMs?: number }
): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 20_000);

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "accept": "text/html,application/xhtml+xml",
                ...(opts?.headers ?? {})
            },
            signal: controller.signal
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
        }
        return await res.text();
    } finally {
        clearTimeout(timeout);
    }
}

export async function fetchJson<T = unknown>(
    url: string,
    opts?: {
        headers?: Record<string, string>;
        timeoutMs?: number;
        method?: 'GET' | 'POST';
        body?: object;
    }
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 20_000);

    try {
        const res = await fetch(url, {
            method: opts?.method ?? "GET",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                ...(opts?.headers ?? {})
            },
            body: opts?.body ? JSON.stringify(opts.body) : undefined,
            signal: controller.signal
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
        }
        return await res.json() as T;
    } finally {
        clearTimeout(timeout);
    }
}
