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
