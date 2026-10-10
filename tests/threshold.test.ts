import assert from "node:assert/strict"
import test from "node:test"
import {isValueThreshold, meetsThreshold} from "../src/threshold"

test("requires at least one rate strictly below the threshold", () => {
    const threshold = {below: 6}
    for (const rates of [[6, 6.5, 7], [6.1, 6.2, 6.3]]) {
        assert.equal(meetsThreshold(rates.join("\n"), threshold), false)
    }
    for (const rates of [[5.99, 6, 7], [6, 5.99, 7], [6, 7, 5.99]]) {
        assert.equal(meetsThreshold(rates.join("\n"), threshold), true)
    }
})

test("reads MND percentages and BoA labeled rates, ignoring numbers in names", () => {
    assert.equal(meetsThreshold("30 Yr. Fixed\n6.50%\n15 Yr. Fixed\n6,00%\nSOFR\n6.10%", {below: 6}), false)
    assert.equal(meetsThreshold("30 Yr. Fixed\n6.50%\n15 Yr. Fixed\n5,99%\nSOFR\n6.10%", {below: 6}), true)
    const names = ["Fixed 30 Years", "Fixed 15 Years", "ARM Fixed First 5 Years, Then Adjusts Every 6 Months"]
    assert.equal(meetsThreshold(names.map(name => `${name}: 6.5`).join("\n"), {below: 6}), false)
    assert.equal(meetsThreshold(names.map((name, i) => `${name}: ${i === 2 ? 5.9 : 6.5}`).join("\n"), {below: 6}), true)
    assert.equal(meetsThreshold("6.1 (-5.0%)", {below: 6}), false)
})

test("validates thresholds and reports unreadable data", () => {
    for (const below of [0, -1, 6, 0.5]) assert.equal(isValueThreshold({below}), true)
    for (const value of [null, {}, {below: "6"}, {below: NaN}, {below: Infinity}]) {
        assert.equal(isValueThreshold(value), false)
    }
    for (const text of ["", "N/A", "ARM Fixed First 5 Years", "2026-10-10", "<td>5.9</td>"]) {
        assert.throws(() => meetsThreshold(text, {below: 6}), /no numeric values/)
        assert.equal(meetsThreshold(text), true)
    }
})
