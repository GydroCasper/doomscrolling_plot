const baseUrl = 'http://localhost:3001'

export async function startGrabbing(streamingCallback: (message: string) => void) {
    const response = await fetch(baseUrl + '/api/run', {method: 'POST'})

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
        const {done, value} = await reader.read()
        if (done) break

        streamingCallback(decoder.decode(value))
    }

    return response
}

export async function fetchDiffs() {
    const response = await fetch(baseUrl + '/api/diffs')
    return response.json()
}