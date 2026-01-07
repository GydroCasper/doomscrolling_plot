import {loadConfig, loadSnapshots, saveDiff, saveSnapshots} from "./fileUtils"
import {fetchHtml} from "./fetch"
import {extractPart} from "./extract"
import {createTwoFilesPatch} from "diff"

const CONFIG_PATH = "../config.json";
const SNAPSHOTS_PATH = "../snapshots.json";
const DIFFS_DIR = "../diffs";

async function main() {
    const config = await loadConfig(CONFIG_PATH);
    const snapshots = await loadSnapshots(SNAPSHOTS_PATH);

    const results: Array<{ id: string; status: string; details?: string }> = [];

    for (const src of config) {
        try {
            const html = await fetchHtml(src.url, {headers: src.headers, timeoutMs: src.timeoutMs});
            const extracted = extractPart(html, src.match);

            const previous = snapshots[src.id];

            if (previous === extracted) {
                console.log(`${src.id}: unchanged`);
                continue;
            }

            if(previous) {
                const diff = createTwoFilesPatch(
                    `${src.id}/old`,
                    `${src.id}/new`,
                    previous ?? "",
                    extracted
                );
                await saveDiff(DIFFS_DIR, src.id, diff);
                console.log(`${src.id}: CHANGED (diff saved)`);
            } else {
                console.log(`${src.id}: CREATED`);
            }

            snapshots[src.id] = extracted;
        } catch (e: any) {
            results.push({id: src.id, status: "error", details: e?.message ?? String(e)});
        }

        await saveSnapshots(SNAPSHOTS_PATH, snapshots);
    }
}

main().catch((e) => {
    console.error(e);
});