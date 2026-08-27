import {dataRepository} from "../repositories/firestore-repository.ts"
import type {DiffEntry} from "../types/diff-entry.ts"

export async function fetchDiffs(): Promise<DiffEntry[]> {
    const [diffs, sourceUrls] = await Promise.all([
        dataRepository.findAll(),
        dataRepository.findSourceUrlMap()
    ])

    return diffs.map(diff => ({
        ...diff,
        sourceUrl: sourceUrls[diff.sourceId]
    }))
}
