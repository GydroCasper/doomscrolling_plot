import {ConfigFile} from "./types"
import { promises as fs } from "node:fs";
import {dirname, join} from "node:path";

export async function loadConfig(path: string): Promise<ConfigFile> {
    const raw = await fs.readFile(path, "utf-8");
    const parsed = JSON.parse(raw) as ConfigFile;

    // минимальная валидация
    const ids = new Set<string>();
    for (const s of parsed) {
        if (!s.id || !s.url || (!s.match?.selector && !s.match?.selectors && !s.match?.jsonPath) || !s.match?.extract) {
            throw new Error(`Invalid config entry: ${JSON.stringify(s)}`);
        }
        if (ids.has(s.id)) throw new Error(`Duplicate id in config: ${s.id}`);
        ids.add(s.id);
    }
    return parsed;
}

export async function loadLastChange(path: string): Promise<Record<string, string>> {
    try {
        const text = await fs.readFile(path, "utf-8");
        return JSON.parse(text);
    } catch (error: any) {
        if (error?.code === "ENOENT") {
            return {};
        }
        throw new Error(`Failed to load last-change data from ${path}: ${error?.message ?? error}`);
    }
}

export async function saveLastChange(path: string, data: Record<string, string>): Promise<void> {
    await writeJsonAtomic(path, data);
}

async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
    const dir = dirname(path);
    const tempPath = join(
        dir,
        `.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.${path.split('/').pop()}`
    );

    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempPath, path);
}
