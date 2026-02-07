import {Summary} from "./types.js"
import {logger} from "./utils/logger"

export function initSummary(): Summary {
    return {unchanged: 0, skipped: 0, failed: 0, changed: []}
}

export function printSummary(summary: Summary): void {
    logger.info("\n=== Summary ===")
    logger.info(`Unchanged: ${summary.unchanged}`)
    logger.info(`Skipped: ${summary.skipped}`)
    logger.info(`Failed: ${summary.failed}`)
    logger.info(`Changed: ${summary.changed.length > 0 ? summary.changed.join(", ") : "none"}`)
}