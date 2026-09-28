import assert from "node:assert/strict"
import test from "node:test"
import {isChangeFilter, isInsignificantChange} from "../src/changeFilter"

const rubles = {type: "numericThreshold", minChange: 1, roundTo: 1} as const

test("compares rates rounded down and ignores accompanying percentage changes", () => {
    assert.equal(isInsignificantChange("90.10 (+1.00%)", "90.40 (-2.00%)", rubles), true)
    assert.equal(isInsignificantChange("90,40", "90,60", rubles), true)
    assert.equal(isInsignificantChange("90.60", "90.40", rubles), true)
    assert.equal(isInsignificantChange("90.60", "91.00", rubles), false)
    assert.equal(isInsignificantChange("91.00", "90.99", rubles), false)
    assert.equal(isInsignificantChange("-90.40", "-90.60", rubles), true)
    assert.equal(isInsignificantChange("-90.00", "-90.01", rubles), false)
    assert.equal(isInsignificantChange("90", "92", rubles), false)
})

test("supports source-specific thresholds and accumulated movement from the baseline", () => {
    const filter = {type: "numericThreshold", minChange: 2} as const
    assert.equal(isInsignificantChange("90", "91", filter), true)
    assert.equal(isInsignificantChange("90", "91.9", filter), true)
    assert.equal(isInsignificantChange("90", "92", filter), false)
    assert.equal(isInsignificantChange("90", "88", filter), false)
    assert.equal(isInsignificantChange("1.1", "1.2", {...filter, minChange: 0.1}), false)
})

test("unconfigured sources and unrecognized numeric formats remain visible", () => {
    assert.equal(isInsignificantChange("90", "90.1"), false)
    for (const value of ["", "N/A", "<td>90</td>", "90 rubles", "2026-09-28", "Infinity"]) {
        assert.equal(isInsignificantChange("90", value, rubles), false)
        assert.equal(isInsignificantChange(value, "90", rubles), false)
    }
})

test("validates Firestore filter settings", () => {
    assert.equal(isChangeFilter(rubles), true)
    assert.equal(isChangeFilter({type: "numericThreshold", minChange: 0.1}), true)
    for (const filter of [null, {}, {...rubles, type: "unknown"}, {...rubles, minChange: 0},
        {...rubles, minChange: NaN}, {...rubles, minChange: "1"}, {...rubles, roundTo: -1},
        {...rubles, roundTo: Infinity}]) {
        assert.equal(isChangeFilter(filter), false)
    }
})
