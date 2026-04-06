import {readdir, readFile, unlink} from 'fs/promises'
import {join} from 'path'
import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import {cors} from 'hono/cors'
import {streamText} from 'hono/streaming'
import {Writable} from 'stream'
import {processSources} from './processor'
import {addStreamTransport} from './utils/logger'
import {loadConfig} from './fileUtils'

const DIFFS_DIR = './diffs'
const CONFIG_PATH = './config.json'
const PORT = 3001

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

        diffs.push({id, date, diffText: content, sourceUrl: urlById[id]})
    }

    return diffs.sort((a, b) => b.date.localeCompare(a.date))
}

const app = new Hono()

app.use('*', cors())

app.get('/api/diffs', async (c) => {
    return c.json(await getDiffs())
})

app.delete('/api/diffs/:sourceId', async (c) => {
    const sourceId = c.req.param('sourceId')
    const files = await readdir(DIFFS_DIR)
    const toDelete = files.filter(f => f.endsWith('.diff') && f.replace('.diff', '').split('_').slice(1).join('_') === sourceId)
    await Promise.all(toDelete.map(f => unlink(join(DIFFS_DIR, f))))
    return c.json({deleted: toDelete.length})
})

app.delete('/api/diff/:filename', async (c) => {
    const filename = c.req.param('filename')
    await unlink(join(DIFFS_DIR, `${filename}.diff`))
    return c.json({deleted: 1})
})

app.post('/api/run', (c) => {
    return streamText(c, async (stream) => {
        const writable = new Writable({
            write(chunk: Buffer, _enc: string, cb: () => void) {
                stream.writeln(chunk.toString())
                cb()
            }
        })

        const removeTransport = addStreamTransport(writable)

        try {
            await processSources()
        } catch (e: any) {
            await stream.writeln(`[ERROR] ${e.message}`)
        } finally {
            await new Promise(resolve => setImmediate(resolve))
            removeTransport()
        }
    })
})

serve({fetch: app.fetch, port: PORT})
