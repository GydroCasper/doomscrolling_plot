import {fetch, type Response} from "undici";
import { chromium } from "playwright";
import {PlaywrightOptions} from "./types";

export type RetryPolicy = {
    maxAttempts: number;
    shouldRetry: (response: Response) => boolean;
    getDelayMs: (response: Response, attempt: number) => number;
};

export type FetchOptions = {
    headers?: Record<string, string>;
    timeoutMs?: number;
    retry?: RetryPolicy;
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchText(
    url: string,
    options: {
        headers: Record<string, string>;
        timeoutMs: number;
        method?: "GET" | "POST";
        body?: string;
        retry?: RetryPolicy;
    }
): Promise<{response: Response; text: string}> {
    const retryPolicy = options.retry;
    const maxAttempts = Math.max(1, retryPolicy?.maxAttempts ?? 1);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let delayBeforeRetry: number | undefined;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

        try {
            const response = await fetch(url, {
                method: options.method ?? "GET",
                headers: options.headers,
                body: options.body,
                signal: controller.signal
            });

            if (retryPolicy && retryPolicy.shouldRetry(response) && attempt < maxAttempts - 1) {
                delayBeforeRetry = retryPolicy.getDelayMs(response, attempt);
                await response.body?.cancel();
            } else {
                return {response, text: await response.text()};
            }
        } finally {
            clearTimeout(timeout);
        }

        if (delayBeforeRetry !== undefined) {
            await sleep(delayBeforeRetry);
        }
    }

    throw new Error(`Failed to fetch ${url}`);
}

export async function fetchHtml(
    url: string,
    opts?: FetchOptions
): Promise<string> {
    const {response, text} = await fetchText(url, {
        headers: {
            "accept": "text/html,application/xhtml+xml",
            ...(opts?.headers ?? {})
        },
        timeoutMs: opts?.timeoutMs ?? 20_000,
        retry: opts?.retry
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    return text;
}

export async function fetchJson<T = unknown>(
    url: string,
    opts?: {
        headers?: Record<string, string>;
        timeoutMs?: number;
        method?: 'GET' | 'POST';
        body?: object;
        retry?: RetryPolicy;
    }
): Promise<T> {
    const {response, text: responseText} = await fetchText(url, {
        method: opts?.method,
        headers: {
            "accept": "application/json",
            "content-type": "application/json",
            ...(opts?.headers ?? {})
        },
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
        timeoutMs: opts?.timeoutMs ?? 20_000,
        retry: opts?.retry
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }

    let text = responseText;

    // Strip JSONP prefix like {}&&
    if (text.startsWith('{}&&')) {
        text = text.slice(4);
    }

    return JSON.parse(text);
}

export async function fetchWithPlaywright(
    url: string,
    options: PlaywrightOptions = {}
): Promise<string> {
    const {
        headless = true,
        waitForSelector,
        timeoutMs = 30000
    } = options;
    const browser = await chromium.launch({headless});
    const page = await browser.newPage();

    try {
        await page.goto(url, { timeout: timeoutMs });
        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout: timeoutMs });
        }
        return await page.content();
    } finally {
        await browser.close();
    }
}
