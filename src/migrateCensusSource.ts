import {databaseRepository} from "./repositories/firestoreRepository"
import {SourceConfig} from "./types"

const censusSource: SourceConfig = {
    id: "us-census-population",
    url: "https://www2.census.gov/programs-surveys/popest/datasets/",
    match: {
        selector: "table tr:has(td a[href^='2020-']) td:nth-child(2), table tr:has(td a[href^='2020-']) td:nth-child(3)",
        extract: "text"
    }
}

async function main() {
    await databaseRepository.saveSourceConfig(censusSource)
    console.log(`Updated Firestore source: ${censusSource.id}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
