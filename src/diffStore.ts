import {FieldValue} from "firebase-admin/firestore"
import {FIRESTORE_BATCH_SIZE, firestore} from "./firestore"
import {areStrings} from "./utils/typeGuards"

const DIFFS_COLLECTION = "diffs"

export type StoredDiff = {
    diffId: string
    sourceId: string
    date: string
    diffText: string
    reviewedAt: string | null
}

function documentId(sourceId: string, date: string): string {
    return `${date}_${encodeURIComponent(sourceId)}`
}

export function createDiffDate(date = new Date()): string {
    return date.toISOString().replace(/[:.]/g, "-")
}

export async function saveDiff(sourceId: string, diffText: string): Promise<void> {
    await saveDiffAt(sourceId, createDiffDate(), diffText)
}

export async function saveDiffAt(sourceId: string, date: string, diffText: string, reviewedAt: Date | null = null): Promise<void> {
    await firestore()
        .collection(DIFFS_COLLECTION)
        .doc(documentId(sourceId, date))
        .set({
            sourceId,
            date,
            diffText,
            reviewedAt,
            createdAt: FieldValue.serverTimestamp()
        })
}

export async function loadDiffs(): Promise<StoredDiff[]> {
    const documents = await firestore().collection(DIFFS_COLLECTION).get()
    const diffs = documents.docs.map((document): StoredDiff => {
        const data = document.data()

        if (!areStrings(data.sourceId, data.date, data.diffText)) {
            throw new Error(`Invalid diff document: ${document.id}`)
        }

        const reviewedAt = data.reviewedAt === null || data.reviewedAt === undefined
            ? null
            : data.reviewedAt.toDate().toISOString()

        return {diffId: document.id, sourceId: data.sourceId, date: data.date, diffText: data.diffText, reviewedAt}
    })

    return diffs.sort((a, b) => b.date.localeCompare(a.date))
}

export async function markDiffsReviewed(diffIds: string[]): Promise<number> {
    const database = firestore()
    const uniqueIds = [...new Set(diffIds)]
    let reviewed = 0

    for (let start = 0; start < uniqueIds.length; start += FIRESTORE_BATCH_SIZE) {
        const references = uniqueIds
            .slice(start, start + FIRESTORE_BATCH_SIZE)
            .map(diffId => database.collection(DIFFS_COLLECTION).doc(diffId))
        const documents = await database.getAll(...references)
        const toReview = documents.filter(document => document.exists && document.data()?.reviewedAt === null)

        if (toReview.length === 0) continue

        const batch = database.batch()
        for (const document of toReview) {
            batch.update(document.ref, {reviewedAt: FieldValue.serverTimestamp()})
        }
        await batch.commit()
        reviewed += toReview.length
    }

    return reviewed
}

export async function deleteDiff(diffId: string): Promise<number> {
    const reference = firestore().collection(DIFFS_COLLECTION).doc(diffId)
    const document = await reference.get()

    if (!document.exists) return 0

    await reference.delete()
    return 1
}

export async function deleteOtherDiffs(sourceId: string, keepDiffId: string): Promise<number | null> {
    const database = firestore()
    const documents = await database.collection(DIFFS_COLLECTION).where("sourceId", "==", sourceId).get()
    if (!documents.docs.some(document => document.id === keepDiffId)) return null

    const toDelete = documents.docs.filter(document => document.id !== keepDiffId)

    for (let start = 0; start < toDelete.length; start += FIRESTORE_BATCH_SIZE) {
        const batch = database.batch()
        for (const document of toDelete.slice(start, start + FIRESTORE_BATCH_SIZE)) {
            batch.delete(document.ref)
        }
        await batch.commit()
    }

    return toDelete.length
}
