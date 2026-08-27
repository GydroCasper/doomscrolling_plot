import {diffRepository} from "../repositories/diff-repository.ts"

export async function markDiffsReviewed(diffIds: string[]): Promise<void> {
    await diffRepository.markReviewed(diffIds)
}

export async function deleteOtherDiffs(sourceId: string, keepDiffId: string): Promise<void> {
    await diffRepository.deleteOthers(sourceId, keepDiffId)
}

export async function deleteDiff(diffId: string): Promise<void> {
    await diffRepository.deleteById(diffId)
}
