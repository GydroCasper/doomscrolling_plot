import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import {cors} from 'hono/cors'
import {streamText} from 'hono/streaming'
import {Writable} from 'stream'
import {processSources} from './processor'
import {addStreamTransport} from './utils/logger'
import {areStrings} from './utils/typeGuards'
import {deleteDiff, deleteOtherDiffs, loadDiffs, markDiffsReviewed} from './diffStore'
import {loadSourceConfigs} from './sourceConfigStore'

const PORT = 3001

async function getDiffs() {
    const [diffs, config] = await Promise.all([
        loadDiffs(),
        loadSourceConfigs().catch(() => [] as any[])
    ])
    const urlById = Object.fromEntries(config.map((s: any) => [s.id, s.url]))
    return diffs.map(diff => ({...diff, sourceUrl: urlById[diff.sourceId]}))
}

const app = new Hono()

app.use('*', cors())

app.get('/api/diffs', async (c) => {
    return c.json(await getDiffs())
})

app.patch('/api/diffs/reviewed', async (c) => {
    const body = await c.req.json().catch(() => null)
    const diffIds = body?.diffIds

    if (!Array.isArray(diffIds) || !areStrings(...diffIds)) {
        return c.json({error: 'diffIds must be an array of strings'}, 400)
    }

    return c.json({reviewed: await markDiffsReviewed(diffIds)})
})

app.delete('/api/diffs/:sourceId/except/:diffId', async (c) => {
    const sourceId = c.req.param('sourceId')
    const diffId = c.req.param('diffId')
    const deleted = await deleteOtherDiffs(sourceId, diffId)
    if (deleted === null) {
        return c.json({error: 'Diff to keep was not found for this source'}, 404)
    }
    return c.json({deleted})
})

app.delete('/api/diff/:diffId', async (c) => {
    return c.json({deleted: await deleteDiff(c.req.param('diffId'))})
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
