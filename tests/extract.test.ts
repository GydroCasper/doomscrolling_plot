import assert from "node:assert/strict";
import test from "node:test";
import {extractPart} from "../src/extract";

test("removeTableIds removes id attributes from tr and td elements only", () => {
    const html = `
        <table>
            <tbody>
                <tr id="row-id">
                    <td id="cell-id"><span id="content-id">Value</span></td>
                    <td class="plain-cell">Other</td>
                </tr>
            </tbody>
        </table>
    `;

    const extracted = extractPart(html, {
        selector: "tr",
        extract: "html",
        filters: ["removeTableIds"]
    });

    assert.match(extracted, /<tr>/);
    assert.match(extracted, /<td><span id="content-id">Value<\/span><\/td>/);
    assert.match(extracted, /<td class="plain-cell">Other<\/td>/);
    assert.doesNotMatch(extracted, /<tr[^>]*\sid=/);
    assert.doesNotMatch(extracted, /<td[^>]*\sid=/);
});

test("removeTableIds also works when td is the selected element", () => {
    const extracted = extractPart("<table><tbody><tr><td id=\"cell-id\">Value</td></tr></tbody></table>", {
        selector: "td",
        extract: "html",
        filters: ["removeTableIds"]
    });

    assert.equal(extracted, "<td>Value</td>");
});
