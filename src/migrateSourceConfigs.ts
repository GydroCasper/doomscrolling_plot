import {loadConfig} from "./fileUtils"
import {importSourceConfigs} from "./sourceConfigStore"

const CONFIG_PATH = "./config.json"

async function main() {
    const sources = await loadConfig(CONFIG_PATH)
    const imported = await importSourceConfigs(sources)
    console.log(`Imported ${imported} source configurations into Firestore.`)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
