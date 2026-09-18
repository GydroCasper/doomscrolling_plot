import assert from "node:assert/strict"
import test, {mock} from "node:test"
import {Firestore, Timestamp} from "firebase-admin/firestore"
import {databaseRepository} from "../src/repositories/firestoreRepository"

const RUN_LOCK_DURATION_MS = 60 * 60 * 1000

// Serialized transactions model atomic access without initializing Firebase.
function fakeDatabase() {
    let now = 1_000_000
    let data: Record<string, unknown> | undefined
    let queue = Promise.resolve()
    const reference = {}
    const database = {
        collection(name: string) {
            assert.equal(name, "crawlerMetadata")
            return {doc(name: string) {
                assert.equal(name, "runLock")
                return reference
            }}
        },
        runTransaction(callback: (transaction: unknown) => Promise<void>) {
            const result = queue.then(() => callback({
                async get() {
                    return {
                        exists: data !== undefined,
                        readTime: Timestamp.fromMillis(now),
                        data: () => data
                    }
                },
                set(_reference: unknown, value: Record<string, unknown>) { data = value },
                delete() { data = undefined }
            }))
            queue = result.catch(() => {})
            return result
        }
    } as unknown as Firestore
    return {database, advance: (ms: number) => { now += ms }, data: () => data}
}

test("only one competing run acquires the lock; release permits another", async t => {
    const fake = fakeDatabase()
    // Replace only the private database factory; never initialize credentials.
    const repository = databaseRepository as unknown as {database(): Firestore}
    const databaseMock = mock.method(repository, "database", () => fake.database)
    t.after(() => databaseMock.mock.restore())
    const results = await Promise.allSettled([
        databaseRepository.acquireRunLock(), databaseRepository.acquireRunLock()
    ])
    assert.equal(results[0].status, "fulfilled")
    assert.equal(results[1].status, "rejected")
    if (results[0].status !== "fulfilled") throw new Error("Expected lock")
    await results[0].value()
    assert.equal(fake.data(), undefined)
    await databaseRepository.acquireRunLock()
})

test("lock expires at exactly one hour and old owner cannot release new lock", async t => {
    const fake = fakeDatabase()
    // Replace only the private database factory; never initialize credentials.
    const repository = databaseRepository as unknown as {database(): Firestore}
    const databaseMock = mock.method(repository, "database", () => fake.database)
    t.after(() => databaseMock.mock.restore())
    const releaseOld = await databaseRepository.acquireRunLock()
    fake.advance(RUN_LOCK_DURATION_MS - 1)
    await assert.rejects(databaseRepository.acquireRunLock(), /already running/)
    fake.advance(1)
    const releaseNew = await databaseRepository.acquireRunLock()
    const owner = fake.data()?.ownerId
    await releaseOld()
    assert.equal(fake.data()?.ownerId, owner)
    await assert.rejects(databaseRepository.acquireRunLock(), /already running/)
    await releaseNew()
    await releaseNew()
    assert.equal(fake.data(), undefined)
})
