import {ConfigFile} from "./types"
import { promises as fs } from "node:fs";

export async function loadConfig(path: string): Promise<ConfigFile> {
    const raw = await fs.readFile(path, "utf-8");
    const parsed = JSON.parse(raw) as ConfigFile;

    // минимальная валидация
    const ids = new Set<string>();
    for (const s of parsed) {
        if (!s.id || !s.url || !s.match?.selector || !s.match?.extract) {
            throw new Error(`Invalid config entry: ${JSON.stringify(s)}`);
        }
        if (ids.has(s.id)) throw new Error(`Duplicate id in config: ${s.id}`);
        ids.add(s.id);
    }
    return parsed;
}