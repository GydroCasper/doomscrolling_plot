import {loadConfig, loadLastChange, loadSnapshots, saveDiff, saveLastChange, saveSnapshots} from "./fileUtils"
import {fetchHtml, fetchJson, fetchWithPlaywright} from "./fetch"
import {extractJson, extractPart} from "./extract"
import {applyTransformer} from "./transformers"
import {createTwoFilesPatch} from "diff"
import {initSummary, printSummary} from "./summary"
import {SourceConfig, Summary} from "./types"

const CONFIG_PATH = "../config.json";
const SNAPSHOTS_PATH = "../snapshots.json";
const DIFFS_DIR = "../diffs";
const LAST_CHANGE_PATH = "../lastChange.json";

export async function processSources() {
    const config = await loadConfig(CONFIG_PATH);
    const snapshots = await loadSnapshots(SNAPSHOTS_PATH);
    const lastChange = await loadLastChange(LAST_CHANGE_PATH);

    const today = new Date().toISOString().slice(0, 10);      // "2026-01-16"
    const thisMonth = new Date().toISOString().slice(0, 7);   // "2026-01"

    const summary = initSummary();

    for (const src of config) {
        try {
          await processSource(src, lastChange, today, thisMonth, summary, snapshots);
        } catch (e: any) {
            console.log(`${src.id}: ERROR. ${e}`);
            summary.failed++;
        }

        await saveSnapshots(SNAPSHOTS_PATH, snapshots);
    }

    printSummary(summary);
}

async function processSource(src: SourceConfig, lastChange: Record<string, string>, today: string, thisMonth: string, summary: Summary, snapshots: Record<string, string>) {
    let extracted: string;
    if(src.frequency){
        // Skip if already got new data this period
        if (src.frequency === "daily" && lastChange[src.id] === today) {
            console.log(`${src.id}: skipped (already updated today)`);
            summary.skipped++;
            return;
        }
        if (src.frequency === "monthly" && lastChange[src.id] === thisMonth) {
            console.log(`${src.id}: skipped (already updated this month)`);
            summary.skipped++;
            return;
        }
    }

    if (src.match.extract === 'json') {
        if (src.match.transformer) {
            const data = await fetchJson(src.url, src);
            const jsonData = extractJson(data, src.match.jsonPath!);
            extracted = applyTransformer(src.match.transformer, [jsonData], src.match.transformerOptions);
        } else {
            const data = await fetchJson(src.url, src);
            extracted = extractJson(data, src.match.jsonPath!);
        }
        // } else if (src.match.transformer && src.match.selectors) {
        //     const html = await fetchHtml(src.url, src);
        //     const values = extractMultiple(html, src.match.selectors, src.match.extract as "text" | "html");
        //     extracted = applyTransformer(src.match.transformer, values);
    } else if (src.usePlaywright) {
        const html = await fetchWithPlaywright(src.url, src.waitForSelector, src.timeoutMs);
        extracted = extractPart(html, src.match);
    }
    else {
        const html = await fetchHtml(src.url, src);
        extracted = extractPart(html, src.match);
    }

    const previous = snapshots[src.id];

    if (previous === extracted) {
        summary.unchanged++;
        console.log(`${src.id}: unchanged`);
        return;
    }

    if(previous) {
        const diff = createTwoFilesPatch(
            src.id,
            src.id,
            previous ?? "",
            extracted
        );
        await saveDiff(DIFFS_DIR, src.id, diff);
        summary.changed.push(src.id);
        console.log(`${src.id}: CHANGED (diff saved)`);
    } else {
        console.log(`${src.id}: CREATED`);
    }

    snapshots[src.id] = extracted;

    if (previous !== extracted) {
        lastChange[src.id] = src.frequency === "monthly" ? thisMonth : today;
        await saveLastChange(LAST_CHANGE_PATH, lastChange);
    }
}