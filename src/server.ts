import {readdir, readFile} from 'fs/promises'
import {createServer} from 'http'
import {join} from 'path'
import {processSources} from "./processor"
import {addStreamTransport} from "./utils/logger"

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
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Transfer-Encoding': 'chunked',
            'Access-Control-Allow-Origin': '*'
        })

        const sseStream = new (require('stream').Writable)({
            write(chunk: Buffer, _enc: string, cb: () => void) {
                res.write(chunk.toString())
                cb()
            }
        })

        const removeTransport = addStreamTransport(sseStream)

        try {
            await processSources()
        } catch (e: any) {
            res.write(`[ERROR] ${e.message}\n`)
        } finally {
            await new Promise(resolve => setImmediate(resolve))
            removeTransport()
            res.end()
        }

        return
    }
}).listen(3001)
