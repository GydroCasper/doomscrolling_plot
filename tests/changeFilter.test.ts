import assert from "node:assert/strict"
import test from "node:test"
import {isChangeFilter, isInsignificantChange} from "../src/changeFilter"

const rubles = {type: "numericThreshold", step: 1} as const

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

test("Bitcoin rounds down to thousands", () => {
    const filter = {...rubles, step: 1000} as const
    assert.equal(isInsignificantChange("95400", "95900", filter), true)
    assert.equal(isInsignificantChange("95900", "96000", filter), false)
    assert.equal(isInsignificantChange("96000", "95999", filter), false)
})

test("IMOEX rounds down to hundreds", () => {
    const filter = {...rubles, step: 100} as const
    assert.equal(isInsignificantChange("3210", "3240", filter), true)
    assert.equal(isInsignificantChange("3240", "3250", filter), true)
    assert.equal(isInsignificantChange("3299.99", "3300", filter), false)
    assert.equal(isInsignificantChange("3300", "3299.99", filter), false)
})

test("supports source-specific thresholds and accumulated movement from the baseline", () => {
    const filter = {type: "numericThreshold", step: 2} as const
    assert.equal(isInsignificantChange("90", "91", filter), true)
    assert.equal(isInsignificantChange("90", "91.9", filter), true)
    assert.equal(isInsignificantChange("90", "92", filter), false)
    assert.equal(isInsignificantChange("90", "88", filter), false)
    assert.equal(isInsignificantChange("1.1", "1.2", {...filter, step: 0.1}), false)
    assert.equal(isInsignificantChange("1.19", "1.2", {...filter, step: 0.1}), false)
    assert.equal(isInsignificantChange("1.2", "1.29", {...filter, step: 0.1}), true)
})

test("unconfigured sources and unrecognized numeric formats remain visible", () => {
    assert.equal(isInsignificantChange("90", "90.1"), false)
    for (const value of ["", "N/A", "<td>90</td>", "90 rubles", "2026-09-28", "Infinity"]) {
        assert.equal(isInsignificantChange("90", value, rubles), false)
        assert.equal(isInsignificantChange(value, "90", rubles), false)
    }
})

test("validates Firestore step settings", () => {
    assert.equal(isChangeFilter(rubles), true)
    assert.equal(isChangeFilter({type: "numericThreshold", step: 0.1}), true)
    for (const filter of [null, {}, {type: "numericThreshold"}, {...rubles, type: "unknown"}, {...rubles, step: 0},
        {...rubles, step: NaN}, {...rubles, step: "1"}, {...rubles, step: -1},
        {...rubles, step: Infinity}]) {
        assert.equal(isChangeFilter(filter), false)
    }
})
