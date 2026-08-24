import assert from "node:assert/strict"
import test from "node:test"
import {areStrings} from "../src/utils/typeGuards"

test("areStrings accepts any number of strings", () => {
    assert.equal(areStrings(), true)
    assert.equal(areStrings("one"), true)
    assert.equal(areStrings("one", "two", "three"), true)
})

test("areStrings rejects the collection when any value is not a string", () => {
    assert.equal(areStrings("one", 2, "three"), false)
    assert.equal(areStrings(null), false)
    assert.equal(areStrings(undefined), false)
})
