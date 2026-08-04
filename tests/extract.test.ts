import assert from "node:assert/strict";
import test from "node:test";
import {extractPart} from "../src/extract";

test("cleanWikipediaMarkup removes generated ids, inline styles, and superscript citations", () => {
    const html = `
        <table>
            <tbody>
                <tr id="row-id" style="text-align:right;">
                    <td id="cell-id" style="color:red"><span id="content-id" style="font-weight:bold">Value</span><sup id="cite_ref-36"><a href="#cite_note-36">[36]</a></sup></td>
                    <td class="plain-cell" style="text-align:right;">Other</td>
                </tr>
            </tbody>
        </table>
    `;

    const extracted = extractPart(html, {
        selector: "tr",
        extract: "html",
        filters: ["cleanWikipediaMarkup"]
    });

    assert.match(extracted, /<tr>/);
    assert.match(extracted, /<td><span>Value<\/span><\/td>/);
    assert.match(extracted, /<td class="plain-cell">Other<\/td>/);
    assert.doesNotMatch(extracted, /\sid=/);
    assert.doesNotMatch(extracted, /\sstyle=/);
    assert.doesNotMatch(extracted, /<sup/);
    assert.doesNotMatch(extracted, /\[36\]/);
});

test("cleanWikipediaMarkup also works when td is the selected element", () => {
    const extracted = extractPart("<table><tbody><tr><td id=\"cell-id\">Value</td></tr></tbody></table>", {
        selector: "td",
        extract: "html",
        filters: ["cleanWikipediaMarkup"]
    });

    assert.equal(extracted, "<td>Value</td>");
});

test("last two non-empty rows ignore a trailing MediaWiki row", () => {
    const html = `
        <div class="mw-heading"><h2 id="Vital_statistics">Vital statistics</h2></div>
        <table class="wikitable">
            <tbody>
                <tr><td>2023</td></tr>
                <tr><td>2024</td></tr>
                <tr><td>2025</td></tr>
                <tr class="mw-empty-elt"></tr>
            </tbody>
        </table>
    `;

    const extracted = extractPart(html, {
        selector: ".mw-heading:has(#Vital_statistics) ~ table.wikitable:first tbody tr:not(.mw-empty-elt):gt(-3)",
        extract: "html"
    });

    assert.doesNotMatch(extracted, /2023/);
    assert.match(extracted, /2024/);
    assert.match(extracted, /2025/);
    assert.doesNotMatch(extracted, /mw-empty-elt/);
});
