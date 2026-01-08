import {TransformerOptions} from "./types"

export function applyTransformer(type: string, values: string[], options?: TransformerOptions): string {
    switch (type) {
        case "percentChangeDifferentDay":
            return percentChangeDifferentDay(values[0], options);
        case "percentChangeLastTwo":
            return percentChangeLastTwo(values[0]);
        case "percentChange":
            return percentChange(values[0], values[1]);
        default:
            throw new Error(`Unknown transformer: ${type}`);
    }
}

function percentChange(newVal: string, oldVal: string): string {
    const newNum = parseFloat(newVal.replace(",", ".").replace(/\s/g, ""));
    const oldNum = parseFloat(oldVal.replace(",", ".").replace(/\s/g, ""));

    if (isNaN(newNum) || isNaN(oldNum) || oldNum === 0) {
        throw new Error(`Invalid numbers for percentChange: ${newVal}, ${oldVal}`);
    }

    const change = ((newNum - oldNum) / oldNum) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${newNum} (${sign}${change.toFixed(2)}%)`;
}

function percentChangeDifferentDay(jsonArray: string, options?: TransformerOptions): string {
    const data = JSON.parse(jsonArray);

    const dateField = options?.dateField ?? 'tradedate';
    const valueField = options?.valueField ?? 'rate';

    const newest = data[0];
    const newestDate = newest[dateField];
    const newestValue = newest[valueField];

    const previousDay = data.find((s: any) => s[dateField] !== newestDate);

    if (!previousDay) {
        return `${newestValue} (no previous day data)`;
    }

    const oldValue = previousDay[valueField];
    const change = ((newestValue - oldValue) / oldValue) * 100;
    const sign = change >= 0 ? "+" : "";

    return `${newestValue} (${sign}${change.toFixed(2)}%)`;
}

function percentChangeLastTwo(jsonArray: string): string {
    const data = JSON.parse(jsonArray);

    if (!Array.isArray(data) || data.length < 2) {
        const lastVal = Array.isArray(data) ? data[data.length - 1] : data;
        return `${lastVal} (no previous data)`;
    }

    // Find last two non-null values
    let current: number | null = null;
    let previous: number | null = null;

    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i] != null) {
            if (current === null) {
                current = data[i];
            } else {
                previous = data[i];
                break;
            }
        }
    }

    if (current === null || previous === null) {
        return `${current ?? 'N/A'} (no previous data)`;
    }

    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";

    return `${current.toFixed(2)} (${sign}${change.toFixed(2)}%)`;
}
