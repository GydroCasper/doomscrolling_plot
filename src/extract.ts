import * as cheerio from "cheerio";
import { MatchConfig } from "./types.js";

export function extractPart(html: string, match: MatchConfig): string {
    const $ = cheerio.load(html);
    const nodes = $(match.selector);

    if (nodes.length === 0) {
        // лучше явно сигналить, чем молча писать пустоту.
        throw new Error(`Selector not found: ${match.selector}`);
    }

    let extracted = "";

    if (match.extract === "text") {
        extracted = nodes
            .map((_, el) => $(el).text())
            .get()
            .join("\n");
    } else if (match.extract === "html") {
        extracted = nodes
            .map((_, el) => $.html(el))
            .get()
            .join("\n");
    }

    return normalize(extracted);
}

export function extractJson(data: unknown, jsonPath: string): string {
    if (jsonPath.includes('[*]')) {
        const [arrayPath, fields] = jsonPath.split('[*].');
        const array = getByPath(data, arrayPath);

        if (!Array.isArray(array)) {
            throw new Error(`Path "${arrayPath}" is not an array`);
        }

        const fieldList = fields.replace(/[{}]/g, '').split(',').map(f => f.trim());

        return array.map(item =>
            fieldList.map(field => {
                const val = getByPath(item, field);
                return typeof val === 'object' ? JSON.stringify(val) : val;
            }).join(': ')
        ).join('\n');
    }

    const result = getByPath(data, jsonPath);
    return typeof result === 'object' ? JSON.stringify(result) : String(result);
}

export function extractMultiple(html: string, selectors: string[], extract: "text" | "html"): string[] {
    const $ = cheerio.load(html);
    return selectors.map(selector => {
        const node = $(selector).first();
        if (node.length === 0) {
            throw new Error(`Selector not found: ${selector}`);
        }
        const value = extract === "text" ? node.text() : $.html(node);
        return normalize(value);
    });
}

function getByPath(obj: unknown, path: string): unknown {
    const parts = path.split(/\.|\[|\]/).filter(p => p);
    let current: any = obj;

    for (const part of parts) {
        if (current == null) return undefined;
        current = current[part];
    }

    return current;
}

function normalize(s: string): string {
    // Нормализация, чтобы не реагировать на случайные пробелы/переводы строк.
    return s
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
