const baseUrl = 'http://localhost:3001'

export const startGrabbing = async () =>
    await fetch(baseUrl + '/api/run', {method: 'POST'})

export async function fetchDiffs() {
    const response = await fetch(baseUrl + '/api/diffs')
    return response.json()
}