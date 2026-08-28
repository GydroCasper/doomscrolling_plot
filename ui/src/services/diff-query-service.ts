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

export function subscribeToDiffs(
    onChange: (diffs: DiffEntry[]) => void,
    onError: (error: Error) => void
): () => void {
    let active = true
    let unsubscribe: (() => void) | undefined

    void dataRepository.findSourceUrlMap()
        .then(sourceUrls => {
            if (!active) return

            unsubscribe = dataRepository.subscribeToDiffs(
                diffs => onChange(diffs.map(diff => ({
                    ...diff,
                    sourceUrl: sourceUrls[diff.sourceId]
                }))),
                onError
            )
        })
        .catch(onError)

    return () => {
        active = false
        unsubscribe?.()
    }
}
