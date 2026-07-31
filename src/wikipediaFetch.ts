import {fetchHtml, type FetchOptions, type RetryPolicy} from "./fetch";
import type {Response} from "undici";

const USER_AGENT = "DoomscrollingPlotBot/1.0 (+https://github.com/GydroCasper/doomscrolling_plot) undici/7";
const MAX_ATTEMPTS = 4;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

const retryPolicy: RetryPolicy = {
    maxAttempts: MAX_ATTEMPTS,
    shouldRetry: response => response.status === 429 || response.status === 503,
    getDelayMs: getRetryDelayMs
};

export function isWikipediaUrl(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "wikipedia.org" || hostname.endsWith(".wikipedia.org");
}

export function fetchWikipediaHtml(url: string, options?: FetchOptions): Promise<string> {
    return fetchHtml(url, {
        ...options,
        headers: {
            ...options?.headers,
            "user-agent": USER_AGENT
        },
        retry: retryPolicy
    });
}

function getRetryDelayMs(response: Response, attempt: number): number {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
        const seconds = Number(retryAfter);
        const delay = Number.isFinite(seconds)
            ? seconds * 1_000
            : Date.parse(retryAfter) - Date.now();

        if (Number.isFinite(delay)) {
            return clampDelay(delay);
        }
    }

    const exponentialDelay = 1_000 * (2 ** attempt);
    const jitter = Math.floor(Math.random() * 250);
    return clampDelay(exponentialDelay + jitter);
}

function clampDelay(delay: number): number {
    return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, delay));
}
