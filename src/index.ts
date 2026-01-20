import {processSource} from "./processor"



async function main() {
    await processSource();
}

main().catch((e) => {
    console.error(e);
});