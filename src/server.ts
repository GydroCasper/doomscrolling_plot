import {readdir, readFile, unlink} from 'fs/promises'
import {createServer} from 'http'
import {join} from 'path'
import {processSources} from "./processor"
import {addStreamTransport} from "./utils/logger"
import {loadConfig} from "./fileUtils"

const DIFFS_DIR = './diffs'
const CONFIG_PATH = './config.json'

async function getDiffs() {
    const [files, config] = await Promise.all([
        readdir(DIFFS_DIR),
        loadConfig(CONFIG_PATH).catch(() => [] as any[])
    ])
    const urlById = Object.fromEntries(config.map((s: any) => [s.id, s.url]))
    const diffs = []

    for (const file of files) {
        if (!file.endsWith('.diff')) continue

        const content = await readFile(join(DIFFS_DIR, file), 'utf-8')
        const [date, ...idParts] = file.replace('.diff', '').split('_')
        const id = idParts.join('_')

        diffs.push({
            id,
            date,
            diffText: content,
            sourceUrl: urlById[id]
        })
    }

    return diffs.sort((a, b) => b.date.localeCompare(a.date))
}

createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE')

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

    const deleteMatch = req.method === 'DELETE' && req.url?.match(/^\/api\/diffs\/(.+)$/)
    if (deleteMatch) {
        const sourceId = decodeURIComponent(deleteMatch[1])
        const files = await readdir(DIFFS_DIR)
        const toDelete = files.filter(f => f.endsWith('.diff') && f.replace('.diff', '').split('_').slice(1).join('_') === sourceId)
        await Promise.all(toDelete.map(f => unlink(join(DIFFS_DIR, f))))
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({deleted: toDelete.length}))
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
