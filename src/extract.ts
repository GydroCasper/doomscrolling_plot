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
    } else if (match.extract === "attr") {
        // if (!match.attrName) throw new Error(`attrName is required for extract="attr"`);
        // extracted = nodes
        //     .map((_, el) => $(el).attr(match.attrName) ?? "")
        //     .get()
        //     .join("\n");
    }

    return normalize(extracted);
}

function normalize(s: string): string {
    // Нормализация, чтобы не реагировать на случайные пробелы/переводы строк.
    return s
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
