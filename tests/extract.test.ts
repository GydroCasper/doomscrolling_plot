import assert from "node:assert/strict";
import test from "node:test";
import {extractPart} from "../src/extract";

test("removeTdId removes id attributes only from td elements", () => {
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
        filters: ["removeTdId"]
    });

    assert.match(extracted, /<tr id="row-id">/);
    assert.match(extracted, /<td><span id="content-id">Value<\/span><\/td>/);
    assert.match(extracted, /<td class="plain-cell">Other<\/td>/);
    assert.doesNotMatch(extracted, /<td[^>]*\sid=/);
});

test("removeTdId also works when td is the selected element", () => {
    const extracted = extractPart("<table><tbody><tr><td id=\"cell-id\">Value</td></tr></tbody></table>", {
        selector: "td",
        extract: "html",
        filters: ["removeTdId"]
    });

    assert.equal(extracted, "<td>Value</td>");
});
