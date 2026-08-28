import {applicationDefault, getApps, initializeApp} from "firebase-admin/app"
import {FieldValue, getFirestore} from "firebase-admin/firestore"
import {ConfigFile, SnapshotsFile, SourceConfig} from "../types"
import {areStrings} from "../utils/typeGuards"

const BATCH_SIZE = 500
const DIFFS_COLLECTION = "diffs"
const SNAPSHOTS_COLLECTION = "snapshots"
const SOURCES_COLLECTION = "sources"
const SOURCE_STATES_COLLECTION = "sourceStates"

export type StoredDiff = {
    diffId: string
    sourceId: string
    date: string
    diffText: string
    reviewedAt: string | null
}

export interface DatabaseRepository {
    importLastChanges(lastChanges: Record<string, string>): Promise<number>
    loadSourceConfigs(): Promise<ConfigFile>
    loadSnapshots(): Promise<SnapshotsFile>
    saveSnapshot(sourceId: string, value: string): Promise<void>
    importSnapshots(snapshots: SnapshotsFile): Promise<number>
    saveDiff(sourceId: string, diffText: string): Promise<void>
    saveDiffAt(sourceId: string, date: string, diffText: string, reviewedAt?: Date | null): Promise<void>
    loadDiffs(): Promise<StoredDiff[]>
    markDiffsReviewed(diffIds: string[]): Promise<number>
    markDiffsWithoutReviewedAt(reviewedAt: Date): Promise<number>
    deleteDiff(diffId: string): Promise<number>
    deleteOtherDiffs(sourceId: string, keepDiffId: string): Promise<number | null>
}

class FirestoreRepository implements DatabaseRepository {
    async importLastChanges(lastChanges: Record<string, string>): Promise<number> {
        const entries = Object.entries(lastChanges)
        const database = this.database()

        for (let start = 0; start < entries.length; start += BATCH_SIZE) {
            const batch = database.batch()

            for (const [sourceId, lastChange] of entries.slice(start, start + BATCH_SIZE)) {
                batch.set(database.collection(SOURCE_STATES_COLLECTION).doc(sourceId), {
                    sourceId,
                    lastChange,
                    updatedAt: FieldValue.serverTimestamp()
                })
            }

            await batch.commit()
        }

        return entries.length
    }

    async loadSourceConfigs(): Promise<ConfigFile> {
        const documents = await this.database().collection(SOURCES_COLLECTION).get()
        const sources = documents.docs.map(document => {
            const source = {
                ...document.data(),
                id: document.id
            }

            if (!isSourceConfig(source)) {
                throw new Error(`Invalid source configuration: ${document.id}`)
            }

            return source
        })

        return sources
    }

    async loadSnapshots(): Promise<SnapshotsFile> {
        const result: SnapshotsFile = {}
        const documents = await this.database().collection(SNAPSHOTS_COLLECTION).get()

        for (const document of documents.docs) {
            const data = document.data()
            if (!areStrings(data.sourceId, data.value)) {
                throw new Error(`Invalid snapshot document: ${document.id}`)
            }
            result[data.sourceId] = data.value
        }

        return result
    }

    async saveSnapshot(sourceId: string, value: string): Promise<void> {
        await this.database()
            .collection(SNAPSHOTS_COLLECTION)
            .doc(sourceId)
            .set({
                sourceId,
                value,
                updatedAt: FieldValue.serverTimestamp()
            })
    }

    async importSnapshots(snapshots: SnapshotsFile): Promise<number> {
        const entries = Object.entries(snapshots)
        const database = this.database()

        for (let start = 0; start < entries.length; start += BATCH_SIZE) {
            const batch = database.batch()

            for (const [sourceId, value] of entries.slice(start, start + BATCH_SIZE)) {
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

    async saveDiff(sourceId: string, diffText: string): Promise<void> {
        await this.saveDiffAt(sourceId, createDiffDate(), diffText)
    }

    async saveDiffAt(
        sourceId: string,
        date: string,
        diffText: string,
        reviewedAt: Date | null = null
    ): Promise<void> {
        await this.database()
            .collection(DIFFS_COLLECTION)
            .doc(diffDocumentId(sourceId, date))
            .set({
                sourceId,
                date,
                diffText,
                reviewedAt,
                createdAt: FieldValue.serverTimestamp()
            })
    }

    async loadDiffs(): Promise<StoredDiff[]> {
        const documents = await this.database().collection(DIFFS_COLLECTION).get()
        const diffs = documents.docs.map((document): StoredDiff => {
            const data = document.data()

            if (!areStrings(data.sourceId, data.date, data.diffText)) {
                throw new Error(`Invalid diff document: ${document.id}`)
            }

            const reviewedAt = data.reviewedAt === null || data.reviewedAt === undefined
                ? null
                : data.reviewedAt.toDate().toISOString()

            return {
                diffId: document.id,
                sourceId: data.sourceId,
                date: data.date,
                diffText: data.diffText,
                reviewedAt
            }
        })

        return diffs.sort((a, b) => b.date.localeCompare(a.date))
    }

    async markDiffsReviewed(diffIds: string[]): Promise<number> {
        const database = this.database()
        const uniqueIds = [...new Set(diffIds)]
        let reviewed = 0

        for (let start = 0; start < uniqueIds.length; start += BATCH_SIZE) {
            const references = uniqueIds
                .slice(start, start + BATCH_SIZE)
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

    async markDiffsWithoutReviewedAt(reviewedAt: Date): Promise<number> {
        const database = this.database()
        const documents = await database.collection(DIFFS_COLLECTION).get()
        const toReview = documents.docs.filter(document => document.data().reviewedAt === undefined)

        for (let start = 0; start < toReview.length; start += BATCH_SIZE) {
            const batch = database.batch()
            for (const document of toReview.slice(start, start + BATCH_SIZE)) {
                batch.update(document.ref, {reviewedAt})
            }
            await batch.commit()
        }

        return toReview.length
    }

    async deleteDiff(diffId: string): Promise<number> {
        const reference = this.database().collection(DIFFS_COLLECTION).doc(diffId)
        const document = await reference.get()

        if (!document.exists) return 0

        await reference.delete()
        return 1
    }

    async deleteOtherDiffs(sourceId: string, keepDiffId: string): Promise<number | null> {
        const database = this.database()
        const documents = await database.collection(DIFFS_COLLECTION).where("sourceId", "==", sourceId).get()
        if (!documents.docs.some(document => document.id === keepDiffId)) return null

        const toDelete = documents.docs.filter(document => document.id !== keepDiffId)

        for (let start = 0; start < toDelete.length; start += BATCH_SIZE) {
            const batch = database.batch()
            for (const document of toDelete.slice(start, start + BATCH_SIZE)) {
                batch.delete(document.ref)
            }
            await batch.commit()
        }

        return toDelete.length
    }

    private database() {
        if (getApps().length === 0) {
            initializeApp({
                credential: applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID
            })
        }

        return getFirestore()
    }
}

function isSourceConfig(value: Record<string, unknown>): value is SourceConfig {
    const match = value.match

    if (!areStrings(value.id, value.url) || typeof match !== "object" || match === null) {
        return false
    }

    const matchDefinition = match as Record<string, unknown>

    return areStrings(matchDefinition.extract)
        && (
            areStrings(matchDefinition.selector)
            || Array.isArray(matchDefinition.selectors)
            || areStrings(matchDefinition.jsonPath)
        )
}

function diffDocumentId(sourceId: string, date: string): string {
    return `${date}_${encodeURIComponent(sourceId)}`
}

function createDiffDate(date = new Date()): string {
    return date.toISOString().replace(/[:.]/g, "-")
}

export const databaseRepository: DatabaseRepository = new FirestoreRepository()
