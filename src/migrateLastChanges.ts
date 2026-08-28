import {loadLastChange} from "./fileUtils"
import {databaseRepository} from "./repositories/firestoreRepository"
import {areStrings} from "./utils/typeGuards"

const LAST_CHANGE_PATH = "./lastChange.json"

async function main() {
    const lastChanges = await loadLastChange(LAST_CHANGE_PATH)

    for (const [sourceId, lastChange] of Object.entries(lastChanges)) {
        if (!areStrings(sourceId, lastChange)) {
            throw new Error(`Invalid last-change entry: ${sourceId}`)
        }
    }

    const imported = await databaseRepository.importLastChanges(lastChanges)
    console.log(`Imported ${imported} last-change entries into Firestore.`)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
