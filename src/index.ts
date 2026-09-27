import {processSources} from "./processor"
import {startRunTimeout} from "./utils/runTimeout"

startRunTimeout()

async function main() {
    await processSources();
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
