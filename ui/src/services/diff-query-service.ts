import {diffRepository} from "../repositories/diff-repository.ts"
import type {DiffEntry} from "../types/diff-entry.ts"
import {loadSourceUrlMap} from "./source-url-service.ts"

export async function fetchDiffs(): Promise<DiffEntry[]> {
    const [diffs, sourceUrls] = await Promise.all([
        diffRepository.findAll(),
        loadSourceUrlMap()
    ])

    return diffs.map(diff => ({
        ...diff,
        sourceUrl: sourceUrls[diff.sourceId]
    }))
}
