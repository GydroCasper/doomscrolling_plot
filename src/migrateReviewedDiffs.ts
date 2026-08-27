import {FIRESTORE_BATCH_SIZE, firestore} from "./firestore"

const DIFFS_COLLECTION = "diffs"
const REVIEWED_AT = new Date("2026-08-26T00:00:00-04:00")

async function main() {
    const database = firestore()
    const documents = await database.collection(DIFFS_COLLECTION).get()
    const withoutReviewedAt = documents.docs.filter(document => document.data().reviewedAt === undefined)

    for (let start = 0; start < withoutReviewedAt.length; start += FIRESTORE_BATCH_SIZE) {
        const batch = database.batch()
        for (const document of withoutReviewedAt.slice(start, start + FIRESTORE_BATCH_SIZE)) {
            batch.update(document.ref, {reviewedAt: REVIEWED_AT})
        }
        await batch.commit()
    }

    console.log(`Marked ${withoutReviewedAt.length} existing diffs as reviewed at ${REVIEWED_AT.toISOString()}.`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
