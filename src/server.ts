import {readdir, readFile} from 'fs/promises'
import {createServer} from 'http'
import {join} from 'path'

const DIFFS_DIR = './diffs'

async function getDiffs() {
    const files = await readdir(DIFFS_DIR);
    const diffs = [];

    for (const file of files) {
        if (!file.endsWith('.diff')) continue;

        const content = await readFile(join(DIFFS_DIR, file), 'utf-8');
        const [date, ...idParts] = file.replace('.diff', '').split('_');
        const id = idParts.join('_');

        diffs.push({
            id,
            date,
            diffText: content
        });
    }

    return diffs.sort((a, b) => b.date.localeCompare(a.date));
}

createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.url === '/api/diffs') {
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(await getDiffs()))
    }
}).listen(3001)
