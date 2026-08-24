import {FieldValue} from "firebase-admin/firestore"
import {SnapshotsFile} from "./types"
import {FIRESTORE_BATCH_SIZE, firestore} from "./firestore"

const SNAPSHOTS_COLLECTION = "snapshots"

export async function loadSnapshots(): Promise<SnapshotsFile> {
    const result: SnapshotsFile = {}
    const documents = await firestore().collection(SNAPSHOTS_COLLECTION).get()

    for (const document of documents.docs) {
        const data = document.data()
        if (typeof data.sourceId !== "string" || typeof data.value !== "string") {
            throw new Error(`Invalid snapshot document: ${document.id}`)
        }
        result[data.sourceId] = data.value
    }

    return result
}

export async function saveSnapshot(sourceId: string, value: string): Promise<void> {
    await firestore()
        .collection(SNAPSHOTS_COLLECTION)
        .doc(sourceId)
        .set({
            sourceId,
            value,
            updatedAt: FieldValue.serverTimestamp()
        })
}

export async function importSnapshots(snapshots: SnapshotsFile): Promise<number> {
    const entries = Object.entries(snapshots)
    const database = firestore()

    for (let start = 0; start < entries.length; start += FIRESTORE_BATCH_SIZE) {
        const batch = database.batch()

        for (const [sourceId, value] of entries.slice(start, start + FIRESTORE_BATCH_SIZE)) {
            batch.set(database.collection(SNAPSHOTS_COLLECTION).doc(sourceId), {
                sourceId,
                value,
                updatedAt: FieldValue.serverTimestamp()
            })
        }

        await batch.commit()
    }

    return entries.length
}
