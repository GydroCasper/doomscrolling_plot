import {writeSync} from "node:fs"

export const RUN_TIMEOUT_MS = 45 * 60 * 1000

// Keep the deadline active even after the run resolves: open SDK connections
// can otherwise keep the scheduled process alive and block subsequent runs.
export function startRunTimeout(timeoutMs = RUN_TIMEOUT_MS): void {
    setTimeout(() => {
        try {
            writeSync(2, `${new Date().toISOString()} Crawler run timed out after ${timeoutMs} ms; exiting with code 124.\n`)
        } finally {
            process.exit(124)
        }
    }, timeoutMs).unref()
}
