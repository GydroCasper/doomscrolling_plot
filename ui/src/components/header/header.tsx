import {useDiff} from "../../context/diff-state.ts"
import {formatDate} from "../../utils/date.ts"
import {styles} from "./header.styles.ts"

export function Header() {
    const {lastRunAt} = useDiff()
    const lastRunLabel = lastRunAt === undefined
        ? "Loading last run..."
        : lastRunAt === null
            ? "Last run: not recorded yet"
            : `Last run: ${formatDate(lastRunAt)}`

    return (
        <header style={styles.container}>
            <span>Crawler runs locally on schedule</span>
            <time dateTime={lastRunAt ?? undefined}>{lastRunLabel}</time>
        </header>
    )
}
