import assert from "node:assert/strict";
import test from "node:test";
import {getGlobalDispatcher, MockAgent, setGlobalDispatcher} from "undici";
import {fetchSourceHtml} from "../src/sourceFetch";

test("Wikipedia requests identify the project and adaptively retry", async () => {
    const originalDispatcher = getGlobalDispatcher();
    const mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    setGlobalDispatcher(mockAgent);

    const requestTimes: number[] = [];
    const wikipedia = mockAgent.get("https://en.wikipedia.org");
    const expectedHeaders = {
        "user-agent": /^DoomscrollingPlotBot\/1\.0 \(\+https:\/\/github\.com\/GydroCasper\/doomscrolling_plot\) undici\/7$/
    };

    wikipedia.intercept({
        path: "/wiki/Test",
        method: "GET",
        headers: expectedHeaders
    }).reply(() => {
        requestTimes.push(Date.now());
        return {
            statusCode: 429,
            data: "rate limited",
            responseOptions: {headers: {"retry-after": "1"}}
        };
    });

    wikipedia.intercept({
        path: "/wiki/Test",
        method: "GET",
        headers: expectedHeaders
    }).reply(() => {
        requestTimes.push(Date.now());
        return {statusCode: 200, data: "<html>ok</html>"};
    });

    try {
        const html = await fetchSourceHtml("https://en.wikipedia.org/wiki/Test");

        assert.equal(html, "<html>ok</html>");
        assert.equal(requestTimes.length, 2);
        assert.ok(
            requestTimes[1] - requestTimes[0] >= 900,
            `Expected Retry-After delay, got ${requestTimes[1] - requestTimes[0]}ms`
        );
        mockAgent.assertNoPendingInterceptors();
    } finally {
        setGlobalDispatcher(originalDispatcher);
        await mockAgent.close();
    }
});
