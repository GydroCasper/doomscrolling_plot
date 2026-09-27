import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {resolve} from "node:path"
import test from "node:test"

function run(code: string) {
    return spawnSync(process.execPath, ["--require", "tsx/cjs", "-e", `
        const {startRunTimeout} = require(${JSON.stringify(resolve(__dirname, "../src/utils/runTimeout.ts"))});
        ${code}
    `], {encoding: "utf8", timeout: 10_000})
}

test("deadline terminates a process with a stuck connection", () => {
    const result = run("startRunTimeout(100); setInterval(() => {}, 1000)")
    assert.ifError(result.error)
    assert.equal(result.status, 124)
    assert.match(result.stderr, /Crawler run timed out after 100 ms/)
})

test("deadline does not keep a completed process alive", () => {
    const result = run("startRunTimeout(60_000)")
    assert.ifError(result.error)
    assert.equal(result.status, 0)
    assert.equal(result.stderr, "")
})
