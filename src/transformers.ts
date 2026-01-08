import {TransformerOptions} from "./types"

export function applyTransformer(type: string, values: string[], options?: TransformerOptions): string {
    switch (type) {
        case "percentChangeDifferentDay":
            return percentChangeDifferentDay(values[0], options);
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