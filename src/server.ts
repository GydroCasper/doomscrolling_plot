import {readdir, readFile} from 'fs/promises'
import {createServer} from 'http'
import {join} from 'path'
import {processSources} from "./processor"

const DIFFS_DIR = './diffs'

async function getDiffs() {
    const files = await readdir(DIFFS_DIR)
    const diffs = []

    for (const file of files) {
        if (!file.endsWith('.diff')) continue

        const content = await readFile(join(DIFFS_DIR, file), 'utf-8')
        const [date, ...idParts] = file.replace('.diff', '').split('_')
        const id = idParts.join('_')

        diffs.push({
            id,
            date,
            diffText: content
        })
    }

    return diffs.sort((a, b) => b.date.localeCompare(a.date))
}

createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        res.writeHead(204)
        res.end()
        return
    }

    if (req.url === '/api/diffs') {
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(await getDiffs()))
        return
    }

    if (req.method === 'POST' && req.url === '/api/run') {
        console.log('Running grabber...')
        res.writeHead(200, {'Content-Type': 'application/json'})
        try {
            await processSources()
            res.end(JSON.stringify({success: true}))
        } catch (e: any) {
            res.end(JSON.stringify({success: false, error: e.message}))
        }
        return
    }
}).listen(3001)
