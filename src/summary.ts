import { Summary } from "./types.js";

export function initSummary(): Summary {
    return { unchanged: 0, skipped: 0, failed: 0, changed: [] };
}

export function printSummary(summary: Summary): void {
    console.log("\n=== Summary ===");
    console.log(`Unchanged: ${summary.unchanged}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Changed: ${summary.changed.length > 0 ? summary.changed.join(", ") : "none"}`);
}