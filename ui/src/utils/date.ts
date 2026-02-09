export function formatDate(dateStr: string): string {
    const isoString = dateStr
        .replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z')

    const date = new Date(isoString)
    const d = date.toLocaleDateString('ru-RU')
    const t = date.toLocaleTimeString('ru-RU', {hour12: false})
    return `${d} ${t}`
}