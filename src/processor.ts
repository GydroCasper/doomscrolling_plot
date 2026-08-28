import {fetchJson} from "./fetch"
import {fetchSourceHtml} from "./sourceFetch"
import {extractJson, extractPart} from "./extract"
import {applyTransformer} from "./transformers"
import {createTwoFilesPatch} from "diff"
import {initSummary, printSummary} from "./summary"
import {SourceConfig, Summary} from "./types"
import {getDateStringInEtTz} from "./utils/date"
import {logger} from "./utils/logger"
import {promises as fs} from "node:fs"
import {databaseRepository} from "./repositories/firestoreRepository"

const RUN_LOCK_PATH = "./grabber.lock"

export async function processSources() {
    const releaseLock = await acquireRunLock()

    try {
        const config = await databaseRepository.loadSourceConfigs()
        const snapshots = await databaseRepository.loadSnapshots()
        const lastChange = await databaseRepository.loadLastChanges()

        const dateString = getDateStringInEtTz()
        const today = dateString.slice(0, 10)      // "2026-01-16"
        const thisMonth = dateString.slice(0, 7)   // "2026-01"

        const summary = initSummary()

        for (const src of config) {
            try {
                await processSource(src, lastChange, today, thisMonth, summary, snapshots)
            } catch (e: any) {
                logger.info((`${src.id}: ERROR. ${e}`))
                summary.failed++
            }
        }

        printSummary(summary)
    } catch (ex: any) {
        logger.info(ex)
    } finally {
        await releaseLock()
    }
}

async function processSource(src: SourceConfig, lastChange: Record<string, string>, today: string, thisMonth: string, summary: Summary, snapshots: Record<string, string>) {
    let extracted: string
    if (src.frequency) {
        // Skip if already got new data this period
        if (src.frequency === "daily" && lastChange[src.id] === today) {
            logger.info(`${src.id}: skipped (already updated today)`)
            summary.skipped++
            return
        }
        if (src.frequency === "monthly" && lastChange[src.id] === thisMonth) {
            logger.info(`${src.id}: skipped (already updated this month)`)
            summary.skipped++
            return
        }
    }

    if (src.match.extract === 'json') {
        if (src.match.transformer) {
            const data = await fetchJson(src.url, src)
            const jsonData = extractJson(data, src.match.jsonPath!)
            extracted = applyTransformer(src.match.transformer, [jsonData], src.match.transformerOptions)
        } else {
            const data = await fetchJson(src.url, src)
            extracted = extractJson(data, src.match.jsonPath!)
        }
        // } else if (src.match.transformer && src.match.selectors) {
        //     const html = await fetchHtml(src.url, src);
        //     const values = extractMultiple(html, src.match.selectors, src.match.extract as "text" | "html");
        //     extracted = applyTransformer(src.match.transformer, values);
    } else {
        const html = await fetchSourceHtml(src.url, src)
        extracted = extractPart(html, src.match)
    }

    const previous = snapshots[src.id]

    if (previous === extracted) {
        summary.unchanged++
        logger.info(`${src.id}: unchanged`)
        return
    }

    if (previous) {
        const diff = createTwoFilesPatch(
            src.id,
            src.id,
            previous ?? "",
            extracted
        )
        await databaseRepository.saveDiff(src.id, diff)
        summary.changed.push(src.id)
        logger.info(`${src.id}: CHANGED (diff saved)`)
    } else {
        logger.info(`${src.id}: CREATED`)
    }

    snapshots[src.id] = extracted
    await databaseRepository.saveSnapshot(src.id, extracted)

    if (previous !== extracted) {
        const changedAt = src.frequency === "monthly" ? thisMonth : today
        lastChange[src.id] = changedAt
        await databaseRepository.saveLastChange(src.id, changedAt)
    }
}

async function acquireRunLock(): Promise<() => Promise<void>> {
    try {
        await fs.writeFile(RUN_LOCK_PATH, String(process.pid), {flag: "wx"});
    } catch (error: any) {
        if (error?.code === "EEXIST") {
            throw new Error(`Grabber is already running (${RUN_LOCK_PATH} exists)`);
        }
        throw error;
    }

    return async () => {
        try {
            await fs.unlink(RUN_LOCK_PATH)
        } catch (error: any) {
            if (error?.code !== "ENOENT") {
                throw error
            }
        }
    }
}
