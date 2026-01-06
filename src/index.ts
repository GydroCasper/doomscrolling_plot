import {loadConfig} from "./fileUtils"
import {fetchHtml} from "./fetch"
import {extractPart} from "./extract"

const CONFIG_PATH = "../config.json";

async function main() {
    const config = await loadConfig(CONFIG_PATH);

    const results: Array<{ id: string; status: string; details?: string }> = [];

    for (const src of config) {
        try {
            const html = await fetchHtml(src.url, { headers: src.headers, timeoutMs: src.timeoutMs });
            const extracted = extractPart(html, src.match);
            console.log(`${src.id}: ${extracted}`);
        } catch (e: any) {
            results.push({id: src.id, status: "error", details: e?.message ?? String(e)});
        }
    }
}

main().catch((e) => {
    console.error(e);
});