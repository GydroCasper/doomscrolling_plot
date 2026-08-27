import {areStrings} from "../../../src/utils/typeGuards.ts"

type SourceDefinition = {
    id: string
    url: string
}

let sourceUrlsPromise: Promise<Record<string, string>> | null = null

export async function loadSourceUrlMap(): Promise<Record<string, string>> {
    sourceUrlsPromise ??= fetch("/config.json").then(async response => {
        if (!response.ok) throw new Error("Could not load source configuration")

        const sources = await response.json() as SourceDefinition[]
        return Object.fromEntries(sources.map(source => {
            if (!areStrings(source.id, source.url)) {
                throw new Error("Invalid source configuration")
            }
            return [source.id, source.url]
        }))
    })

    return sourceUrlsPromise
}
