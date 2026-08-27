import {copyFile, mkdir} from "node:fs/promises"
import {fileURLToPath} from "node:url"

const source = fileURLToPath(new URL("../../config.json", import.meta.url))
const publicDirectory = fileURLToPath(new URL("../public", import.meta.url))
const destination = fileURLToPath(new URL("../public/config.json", import.meta.url))

await mkdir(publicDirectory, {recursive: true})
await copyFile(source, destination)
