export function applyTransformer(type: string, values: string[]): string {
    switch (type) {
        case "percentChangeDifferentDay":
            return percentChangeDifferentDay(values[0]);
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

function percentChangeDifferentDay(jsonArray: string): string {
    const securities = JSON.parse(jsonArray);

    const newest = securities[0];
    const newestDate = newest.tradedate;
    const newestRate = newest.rate;

    // Find first entry from a different day
    const previousDay = securities.find((s: any) => s.tradedate !== newestDate);

    if (!previousDay) {
        return `${newestRate} (no previous day data)`;
    }

    const oldRate = previousDay.rate;
    const change = ((newestRate - oldRate) / oldRate) * 100;
    const sign = change >= 0 ? "+" : "-";

    return `${newestRate} (${sign}${change.toFixed(2)}%)`;
}