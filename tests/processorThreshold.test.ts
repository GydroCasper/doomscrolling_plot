import assert from "node:assert/strict"
import test from "node:test"
import {processSources} from "../src/processor"
import {databaseRepository} from "../src/repositories/firestoreRepository"
import {getGlobalDispatcher, MockAgent, setGlobalDispatcher} from "undici"
import {SourceConfig} from "../src/types"

test("silent snapshots do not consume the daily allowance and repeated crossings produce diffs", async t => {
    const source: SourceConfig = {
        id: "rates", url: "https://example.com", frequency: "daily",
        match: {selector: "td", extract: "text"},
        threshold: {below: 6}, changeFilter: {type: "numericThreshold", step: 10}
    }
    const snapshots: Record<string, string> = {}
    const lastChanges: Record<string, string> = {}
    const diffs: string[] = []
    let html = "<td>6.5</td>"
    // Every repository entry point is replaced: no Firebase initialization or credentials.
    t.mock.method(databaseRepository, "acquireRunLock", async () => async () => {})
    t.mock.method(databaseRepository, "loadSourceConfigs", async () => [source])
    t.mock.method(databaseRepository, "loadSnapshots", async () => snapshots)
    t.mock.method(databaseRepository, "loadLastChanges", async () => lastChanges)
    t.mock.method(databaseRepository, "saveLastRunCompletedAt", async () => {})
    t.mock.method(databaseRepository, "saveSnapshot", async (id: string, value: string) => {snapshots[id] = value})
    t.mock.method(databaseRepository, "saveLastChange", async (id: string, value: string) => {lastChanges[id] = value})
    t.mock.method(databaseRepository, "saveDiff", async (_id: string, diff: string) => {diffs.push(diff)})
    const originalDispatcher = getGlobalDispatcher()
    const agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
    t.after(async () => {
        setGlobalDispatcher(originalDispatcher)
        await agent.close()
    })
    agent.get("https://example.com").intercept({path: "/", method: "GET"})
        .reply(() => ({statusCode: 200, data: `<table><tr>${html}</tr></table>`})).persist()

    await processSources()
    assert.equal(snapshots.rates, "6.5")
    html = "<td>6</td>"
    await processSources()
    assert.equal(snapshots.rates, "6")
    assert.deepEqual(lastChanges, {})
    assert.equal(diffs.length, 0)

    html = "<td>5.9</td>"
    await processSources()
    assert.equal(diffs.length, 1)
    assert.match(diffs[0], /\+5\.9/)
    assert.ok(lastChanges.rates)

    // Simulate the next eligible period; returning above the threshold is silent.
    delete lastChanges.rates
    html = "<td>6.1</td>"
    await processSources()
    assert.equal(diffs.length, 1)
    assert.equal(snapshots.rates, "6.1")
    assert.deepEqual(lastChanges, {})
    html = "<td>5.9</td>"
    await processSources()
    assert.equal(diffs.length, 2)

    delete lastChanges.rates
    html = "<td>5.8</td>"
    await processSources()
    assert.equal(diffs.length, 2) // existing changeFilter still applies below threshold
    assert.equal(snapshots.rates, "5.9")
    html = "<td>N/A</td>"
    await processSources()
    assert.equal(snapshots.rates, "5.9")
    assert.equal(diffs.length, 2)
})
