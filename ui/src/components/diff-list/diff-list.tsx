import {useState} from "react"
import {DiffItem} from "../diff-item/diff-item.tsx"
import {styles} from "./diff-list.styles.tsx"
import {useDiff} from "../../context/diff-context.tsx"
import {deleteDiffsBySourceId} from "../../services/api.ts"
import type {DiffEntry} from "../../types/diff-entry.ts"

export function DiffList() {
    const {diffs} = useDiff()
    const [displayed, setDisplayed] = useState<DiffEntry[] | null>(null)

    const list = displayed ?? diffs

    const idCounts = list.reduce<Record<string, number>>((acc, d) => {
        acc[d.id] = (acc[d.id] ?? 0) + 1
        return acc
    }, {})

    const handleKeepOnly = async (entry: DiffEntry) => {
        setDisplayed(list.filter(d => d.id !== entry.id || (d.id === entry.id && d.date === entry.date)))
        await deleteDiffsBySourceId(entry.id)
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Last changes</h1>
            {list.map(d => (
                <DiffItem
                    key={`${d.id}-${d.date}`}
                    title={d.id}
                    date={d.date}
                    diffText={d.diffText}
                    sourceUrl={d.sourceUrl}
                    hasSiblings={(idCounts[d.id] ?? 0) > 1}
                    onKeepOnly={() => handleKeepOnly(d)}
                />
            ))}
        </div>
    )
}