const baseUrl = 'http://localhost:3001'

export async function startGrabbing(streamingCallback: (message: string) => void) {
    const response = await fetch(baseUrl + '/api/run', {method: 'POST'})

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const text = decoder.decode(value).trim()
        if (!text) continue

        const lines = text.split('\n')
        for (const line of lines) {
            streamingCallback(line.trim())
        }
    }

    return response
}

export async function fetchDiffs() {
    const response = await fetch(baseUrl + '/api/diffs')
    return response.json()
}

export async function deleteDiffsBySourceId(sourceId: string) {
    await fetch(`${baseUrl}/api/diffs/${encodeURIComponent(sourceId)}`, {method: 'DELETE'})
}

export async function deleteDiff(id: string, date: string) {
    await fetch(`${baseUrl}/api/diff/${encodeURIComponent(`${date}_${id}`)}`, {method: 'DELETE'})
}