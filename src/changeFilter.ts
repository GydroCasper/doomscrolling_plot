import {ChangeFilter} from "./types"

export function isChangeFilter(value: unknown): value is ChangeFilter {
    if (typeof value !== "object" || value === null) return false
    const filter = value as Record<string, unknown>
    return filter.type === "numericThreshold"
        && typeof filter.step === "number"
        && Number.isFinite(filter.step) && filter.step > 0
}

// Accept a plain number or the existing transformers' "value (change%)" output.
// Unknown formats must remain visible rather than silently suppressing changes.
function numericValue(value: string): number | undefined {
    const match = value.trim().match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*(?:\([^()]*\))?$/)
    if (!match) return undefined
    const number = Number(match[1].replace(",", "."))
    return Number.isFinite(number) ? number : undefined
}

export function isInsignificantChange(previous: string, next: string, filter?: ChangeFilter): boolean {
    if (!filter) return false
    if (!isChangeFilter(filter)) throw new Error("Invalid change filter")
    const before = numericValue(previous)
    const after = numericValue(next)
    if (before === undefined || after === undefined) return false
    const bucket = (value: number) => {
        const quotient = value / filter.step
        // Correct division noise at decimal boundaries, e.g. 1.2 / 0.1.
        const nearest = Math.round(quotient)
        const tolerance = Number.EPSILON * Math.max(1, Math.abs(quotient))
        return Math.floor(Math.abs(quotient - nearest) <= tolerance ? nearest : quotient)
    }
    const beforeBucket = bucket(before)
    const afterBucket = bucket(after)
    return Number.isFinite(beforeBucket) && Number.isFinite(afterBucket)
        && beforeBucket === afterBucket
}
