import {ConfigFile, SourceConfig} from "./types"
import {firestore} from "./firestore"

const SOURCES_COLLECTION = "sources"

export async function loadSourceConfigs(): Promise<ConfigFile> {
    const documents = await firestore().collection(SOURCES_COLLECTION).get()
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
    const ids = new Set<string>()

    for (const source of sources) {
        if (ids.has(source.id)) {
            throw new Error(`Duplicate source id: ${source.id}`)
        }
        ids.add(source.id)
    }

    return sources
}

function isSourceConfig(value: Record<string, unknown>): value is SourceConfig {
    const match = value.match

    return typeof value.id === "string"
        && typeof value.url === "string"
        && typeof match === "object"
        && match !== null
        && typeof (match as Record<string, unknown>).extract === "string"
        && (
            typeof (match as Record<string, unknown>).selector === "string"
            || Array.isArray((match as Record<string, unknown>).selectors)
            || typeof (match as Record<string, unknown>).jsonPath === "string"
        )
}
