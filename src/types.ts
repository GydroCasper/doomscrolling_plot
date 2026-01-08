export type ConfigFile = SourceConfig[];

export type SourceConfig = {
    id: string;
    url: string;
    match: MatchConfig;
    headers?: Record<string, string>;
    timeoutMs?: number;
};

export type MatchConfig = {
    selector: string;           // CSS selector
    extract: ExtractMode;       // what to extract
    jsonPath?: string;
    // attrName?: string;          // required if extract === "attr"
};

export type ExtractMode = "text" | "html" | "attr" | "json";

export type SnapshotsFile = Record<string, string>;