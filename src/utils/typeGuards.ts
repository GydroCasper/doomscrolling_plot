export function areStrings(...values: unknown[]): boolean {
    return values.every(value => typeof value === "string")
}
