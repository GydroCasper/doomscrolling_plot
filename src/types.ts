export type ConfigFile = SourceConfig[];

export type SourceConfig = {
    id: string;
    url: string;
    match: MatchConfig;
    headers?: Record<string, string>;
    timeoutMs?: number;
    usePlaywright?: boolean;
    waitForSelector?: string;
    frequency?: "daily" | "monthly";
};

export type MatchConfig = {
    selector: string;           // CSS selector
    selectors?: string[];       // CSS selectors to extract parameters for transformer
    extract: ExtractMode;       // what to extract
    filters?: HtmlFilterType[];
    jsonPath?: string;
    transformer?: TransformerType;
    transformerOptions?: TransformerOptions;
};

export type ExtractMode = "text" | "html" | "attr" | "json";

export type HtmlFilterType = "removeTdId";

export type SnapshotsFile = Record<string, string>;

export type TransformerType = "percentChange" | "percentChangeDifferentDay";

export type TransformerOptions = {
    dateField?: string;
    valueField?: string;
};

export type Summary = {
    unchanged: number;
    skipped: number;
    failed: number;
    changed: string[];
};
