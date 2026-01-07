import {ConfigFile, SnapshotsFile} from "./types"
import { promises as fs } from "node:fs";

export async function loadConfig(path: string): Promise<ConfigFile> {
    const raw = await fs.readFile(path, "utf-8");
    const parsed = JSON.parse(raw) as ConfigFile;

    // минимальная валидация
    const ids = new Set<string>();
    for (const s of parsed) {
        if (!s.id || !s.url || (!s.match?.selector && !s.match?.jsonPath) || !s.match?.extract) {
            throw new Error(`Invalid config entry: ${JSON.stringify(s)}`);
        }
        if (ids.has(s.id)) throw new Error(`Duplicate id in config: ${s.id}`);
        ids.add(s.id);
    }
    return parsed;
}

export async function loadSnapshots(path: string): Promise<SnapshotsFile> {
    try {
        const raw = await fs.readFile(path, "utf-8");
        return JSON.parse(raw) as SnapshotsFile;
    } catch {
        return {};
    }
}

export async function saveSnapshots(path: string, data: SnapshotsFile): Promise<void> {
    await fs.writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export async function saveDiff(dir: string, id: string, diff: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.writeFile(`${dir}/${id}_${timestamp}.diff`, diff, "utf-8");
}