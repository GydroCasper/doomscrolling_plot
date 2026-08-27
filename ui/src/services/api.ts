import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where,
    writeBatch
} from "firebase/firestore"
import {db} from "../firebase.ts"
import type {DiffEntry} from "../types/diff-entry.ts"
import {areStrings} from "../../../src/utils/typeGuards.ts"

const DIFFS_COLLECTION = "diffs"
const BATCH_SIZE = 500

type SourceDefinition = {
    id: string
    url: string
}

let sourceUrlsPromise: Promise<Record<string, string>> | null = null

async function loadSourceUrls(): Promise<Record<string, string>> {
    sourceUrlsPromise ??= fetch("/config.json").then(async response => {
        if (!response.ok) throw new Error("Could not load source configuration")

        const sources = await response.json() as SourceDefinition[]
        return Object.fromEntries(sources.map(source => [source.id, source.url]))
    })

    return sourceUrlsPromise
}

export async function fetchDiffs(): Promise<DiffEntry[]> {
    const [snapshot, sourceUrls] = await Promise.all([
        getDocs(query(collection(db, DIFFS_COLLECTION), orderBy("date", "desc"))),
        loadSourceUrls()
    ])

    return snapshot.docs.map(document => {
        const data = document.data()

        if (!areStrings(data.sourceId, data.date, data.diffText)) {
            throw new Error(`Invalid diff document: ${document.id}`)
        }

        const reviewedAt = data.reviewedAt === null || data.reviewedAt === undefined
            ? null
            : data.reviewedAt instanceof Timestamp
                ? data.reviewedAt.toDate().toISOString()
                : null

        return {
            diffId: document.id,
            sourceId: data.sourceId,
            date: data.date,
            diffText: data.diffText,
            reviewedAt,
            sourceUrl: sourceUrls[data.sourceId]
        }
    })
}

export async function markDiffsReviewed(diffIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(diffIds)]

    for (let start = 0; start < uniqueIds.length; start += BATCH_SIZE) {
        const batch = writeBatch(db)
        for (const diffId of uniqueIds.slice(start, start + BATCH_SIZE)) {
            batch.update(doc(db, DIFFS_COLLECTION, diffId), {reviewedAt: serverTimestamp()})
        }
        await batch.commit()
    }
}

export async function deleteOtherDiffs(sourceId: string, keepDiffId: string): Promise<void> {
    const snapshot = await getDocs(query(
        collection(db, DIFFS_COLLECTION),
        where("sourceId", "==", sourceId)
    ))
    const toDelete = snapshot.docs.filter(document => document.id !== keepDiffId)

    for (let start = 0; start < toDelete.length; start += BATCH_SIZE) {
        const batch = writeBatch(db)
        for (const document of toDelete.slice(start, start + BATCH_SIZE)) {
            batch.delete(document.ref)
        }
        await batch.commit()
    }
}

export async function deleteDiff(diffId: string): Promise<void> {
    await deleteDoc(doc(db, DIFFS_COLLECTION, diffId))
}
