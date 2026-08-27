import {collection, getDocs, orderBy, query, Timestamp} from "firebase/firestore"
import {areStrings} from "../../../src/utils/typeGuards.ts"
import {db} from "../firebase.ts"
import type {DiffEntry} from "../types/diff-entry.ts"
import {loadSourceUrlMap} from "./source-url-service.ts"

const DIFFS_COLLECTION = "diffs"

export async function fetchDiffs(): Promise<DiffEntry[]> {
    const [snapshot, sourceUrls] = await Promise.all([
        getDocs(query(collection(db, DIFFS_COLLECTION), orderBy("date", "desc"))),
        loadSourceUrlMap()
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
