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
    writeBatch,
    type DocumentReference
} from "firebase/firestore"
import {areStrings} from "../../../src/utils/typeGuards.ts"
import {db} from "../firebase.ts"
import type {DiffEntry} from "../types/diff-entry.ts"

const DIFFS_COLLECTION = "diffs"
const SOURCES_COLLECTION = "sources"
const BATCH_SIZE = 500

export type StoredDiff = Omit<DiffEntry, "sourceUrl">

export interface DataRepository {
    findAll(): Promise<StoredDiff[]>
    findSourceUrlMap(): Promise<Record<string, string>>
    markReviewed(diffIds: string[]): Promise<void>
    deleteOthers(sourceId: string, keepDiffId: string): Promise<void>
    deleteById(diffId: string): Promise<void>
}

class FirestoreRepository implements DataRepository {
    async findAll(): Promise<StoredDiff[]> {
        const snapshot = await getDocs(query(
            collection(db, DIFFS_COLLECTION),
            orderBy("date", "desc")
        ))

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
                reviewedAt
            }
        })
    }

    async findSourceUrlMap(): Promise<Record<string, string>> {
        const snapshot = await getDocs(collection(db, SOURCES_COLLECTION))

        return Object.fromEntries(snapshot.docs.map(document => {
            const data = document.data()

            if (!areStrings(data.url)) {
                throw new Error(`Invalid source document: ${document.id}`)
            }

            return [document.id, data.url]
        }))
    }

    async markReviewed(diffIds: string[]): Promise<void> {
        const uniqueIds = [...new Set(diffIds)]

        for (let start = 0; start < uniqueIds.length; start += BATCH_SIZE) {
            const batch = writeBatch(db)
            for (const diffId of uniqueIds.slice(start, start + BATCH_SIZE)) {
                batch.update(doc(db, DIFFS_COLLECTION, diffId), {reviewedAt: serverTimestamp()})
            }
            await batch.commit()
        }
    }

    async deleteOthers(sourceId: string, keepDiffId: string): Promise<void> {
        const snapshot = await getDocs(query(
            collection(db, DIFFS_COLLECTION),
            where("sourceId", "==", sourceId)
        ))
        const references = snapshot.docs
            .filter(document => document.id !== keepDiffId)
            .map(document => document.ref)

        await this.deleteInBatches(references)
    }

    async deleteById(diffId: string): Promise<void> {
        await deleteDoc(doc(db, DIFFS_COLLECTION, diffId))
    }

    private async deleteInBatches(references: DocumentReference[]): Promise<void> {
        for (let start = 0; start < references.length; start += BATCH_SIZE) {
            const batch = writeBatch(db)
            for (const reference of references.slice(start, start + BATCH_SIZE)) {
                batch.delete(reference)
            }
            await batch.commit()
        }
    }
}

export const dataRepository: DataRepository = new FirestoreRepository()
