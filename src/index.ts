import {loadConfig, loadSnapshots, saveDiff, saveSnapshots} from "./fileUtils"
import {fetchHtml, fetchJson} from "./fetch"
import {extractJson, extractMultiple, extractPart} from "./extract"
import {createTwoFilesPatch} from "diff"
import {applyTransformer} from "./transformers"

const CONFIG_PATH = "../config.json";
const SNAPSHOTS_PATH = "../snapshots.json";
const DIFFS_DIR = "../diffs";

async function main() {
    const config = await loadConfig(CONFIG_PATH);
    const snapshots = await loadSnapshots(SNAPSHOTS_PATH);

    for (const src of config) {
        try {
            let extracted: string;
            if (src.match.extract === 'json') {
                if (src.match.transformer) {
                    const data = await fetchJson(src.url, src);
                    const jsonData = extractJson(data, src.match.jsonPath!);
                    extracted = applyTransformer(src.match.transformer, [jsonData]);
                } else {
                    const data = await fetchJson(src.url, src);
                    extracted = extractJson(data, src.match.jsonPath!);
                }
            // } else if (src.match.transformer && src.match.selectors) {
            //     const html = await fetchHtml(src.url, src);
            //     const values = extractMultiple(html, src.match.selectors, src.match.extract as "text" | "html");
            //     extracted = applyTransformer(src.match.transformer, values);
            } else {
                const html = await fetchHtml(src.url, src);
                extracted = extractPart(html, src.match);
            }

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
            console.log(`${src.id}: ERROR. ${e}`);
        }

        await saveSnapshots(SNAPSHOTS_PATH, snapshots);
    }
}

main().catch((e) => {
    console.error(e);
});