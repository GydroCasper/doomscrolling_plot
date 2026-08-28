import {databaseRepository} from "./repositories/firestoreRepository"

const DIFFS_COLLECTION = "diffs"
const REVIEWED_AT = new Date("2026-08-26T00:00:00-04:00")

async function main() {
    const reviewed = await databaseRepository.markDiffsWithoutReviewedAt(REVIEWED_AT)
    console.log(`Marked ${reviewed} existing diffs as reviewed at ${REVIEWED_AT.toISOString()}.`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
