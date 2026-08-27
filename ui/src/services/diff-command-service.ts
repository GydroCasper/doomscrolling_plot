import {dataRepository} from "../repositories/firestore-repository.ts"

export async function markDiffsReviewed(diffIds: string[]): Promise<void> {
    await dataRepository.markReviewed(diffIds)
}

export async function deleteOtherDiffs(sourceId: string, keepDiffId: string): Promise<void> {
    await dataRepository.deleteOthers(sourceId, keepDiffId)
}

export async function deleteDiff(diffId: string): Promise<void> {
    await dataRepository.deleteById(diffId)
}
