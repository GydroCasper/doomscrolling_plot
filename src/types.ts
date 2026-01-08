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
    selectors?: string[];       // CSS selectors to extract parameters for transformer
    extract: ExtractMode;       // what to extract
    jsonPath?: string;
    transformer?: TransformerType;
};

export type ExtractMode = "text" | "html" | "attr" | "json";

export type SnapshotsFile = Record<string, string>;

export type TransformerType = "percentChange";