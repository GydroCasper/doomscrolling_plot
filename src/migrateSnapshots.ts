import {promises as fs} from "node:fs"
import {SnapshotsFile} from "./types"
import {importSnapshots} from "./snapshotStore"

const SNAPSHOTS_PATH = "./snapshots.json"

async function main() {
    const raw = await fs.readFile(SNAPSHOTS_PATH, "utf-8")
    const snapshots = JSON.parse(raw) as SnapshotsFile

    for (const [sourceId, value] of Object.entries(snapshots)) {
        if (typeof value !== "string") {
            throw new Error(`Invalid local snapshot: ${sourceId}`)
        }
    }

    const imported = await importSnapshots(snapshots)
    console.log(`Imported ${imported} snapshots into Firestore.`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
