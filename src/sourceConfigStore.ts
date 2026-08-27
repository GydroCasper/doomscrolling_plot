import {FieldValue} from "firebase-admin/firestore"
import {ConfigFile} from "./types"
import {FIRESTORE_BATCH_SIZE, firestore} from "./firestore"

const SOURCES_COLLECTION = "sources"

export async function importSourceConfigs(sources: ConfigFile): Promise<number> {
    const database = firestore()

    for (let start = 0; start < sources.length; start += FIRESTORE_BATCH_SIZE) {
        const batch = database.batch()

        for (const source of sources.slice(start, start + FIRESTORE_BATCH_SIZE)) {
            batch.set(database.collection(SOURCES_COLLECTION).doc(source.id), {
                ...source,
                updatedAt: FieldValue.serverTimestamp()
            })
        }

        await batch.commit()
    }

    return sources.length
}
