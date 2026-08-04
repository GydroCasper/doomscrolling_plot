import {applicationDefault, getApps, initializeApp} from "firebase-admin/app"
import {FieldValue, getFirestore} from "firebase-admin/firestore"
import {SnapshotsFile} from "./types"

const SNAPSHOTS_COLLECTION = "snapshots"

function firestore() {
    if (getApps().length === 0) {
        initializeApp({
            credential: applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID
        })
    }

    return getFirestore()
}

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

    for (let start = 0; start < entries.length; start += 500) {
        const batch = database.batch()

        for (const [sourceId, value] of entries.slice(start, start + 500)) {
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
