import {ValueThreshold} from "./types"

export function isValueThreshold(value: unknown): value is ValueThreshold {
    if (typeof value !== "object" || value === null) return false
    const threshold = value as Record<string, unknown>
    return typeof threshold.below === "number" && Number.isFinite(threshold.below)
}

// Match complete numeric lines or the value after a label, never numbers in
// product names (e.g. "ARM Fixed First 5 Years, Then Adjusts Every 6 Months").
export function meetsThreshold(extracted: string, threshold?: ValueThreshold): boolean {
    if (!threshold) return true
    if (!isValueThreshold(threshold)) throw new Error("Invalid value threshold")
    const values = extracted.split(/\r?\n/).flatMap(line => {
        const candidate = line.slice(line.lastIndexOf(":") + 1).trim()
        const match = candidate.match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*%?\s*(?:\([^()]*\))?$/)
        if (!match) return []
        const value = Number(match[1].replace(",", "."))
        return Number.isFinite(value) ? [value] : []
    })
    if (values.length === 0) throw new Error("Cannot evaluate threshold: no numeric values found")
    return values.some(value => value < threshold.below)
}
