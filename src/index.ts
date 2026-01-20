import {processSources} from "./processor"



async function main() {
    await processSources();
}

main().catch((e) => {
    console.error(e);
});