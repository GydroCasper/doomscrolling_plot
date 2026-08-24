import {promises as fs} from "node:fs"
import {join} from "node:path"
import {saveDiffAt} from "./diffStore"

const DIFFS_DIR = "./diffs"

async function main() {
    const files = (await fs.readdir(DIFFS_DIR)).filter(file => file.endsWith(".diff"))

    for (const file of files) {
        const name = file.slice(0, -".diff".length)
        const separator = name.indexOf("_")
        if (separator < 1 || separator === name.length - 1) {
            throw new Error(`Invalid local diff filename: ${file}`)
        }

        const date = name.slice(0, separator)
        const sourceId = name.slice(separator + 1)
        const diffText = await fs.readFile(join(DIFFS_DIR, file), "utf-8")
        await saveDiffAt(sourceId, date, diffText)
    }

    console.log(`Imported ${files.length} diffs into Firestore.`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
