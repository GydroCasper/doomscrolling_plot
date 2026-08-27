import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch,
    type DocumentReference
} from "firebase/firestore"
import {db} from "../firebase.ts"

const DIFFS_COLLECTION = "diffs"
const BATCH_SIZE = 500

async function deleteInBatches(references: DocumentReference[]): Promise<void> {
    for (let start = 0; start < references.length; start += BATCH_SIZE) {
        const batch = writeBatch(db)
        for (const reference of references.slice(start, start + BATCH_SIZE)) {
            batch.delete(reference)
        }
        await batch.commit()
    }
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
    const references = snapshot.docs
        .filter(document => document.id !== keepDiffId)
        .map(document => document.ref)

    await deleteInBatches(references)
}

export async function deleteDiff(diffId: string): Promise<void> {
    await deleteDoc(doc(db, DIFFS_COLLECTION, diffId))
}
