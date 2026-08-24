import {useState} from "react"
import {DiffItem} from "../diff-item/diff-item.tsx"
import {styles} from "./diff-list.styles.tsx"
import {useDiff} from "../../context/diff-context.tsx"
import {deleteDiff, deleteOtherDiffs} from "../../services/api.ts"
import type {DiffEntry} from "../../types/diff-entry.ts"

export function DiffList() {
    const {diffs} = useDiff()
    const [displayed, setDisplayed] = useState<DiffEntry[] | null>(null)

    const list = displayed ?? diffs

    const idCounts = list.reduce<Record<string, number>>((acc, d) => {
        acc[d.sourceId] = (acc[d.sourceId] ?? 0) + 1
        return acc
    }, {})

    const handleDelete = async (entry: DiffEntry) => {
        setDisplayed(list.filter(d => d.diffId !== entry.diffId))
        await deleteDiff(entry.diffId)
    }

    const handleKeepOnly = async (entry: DiffEntry) => {
        setDisplayed(list.filter(d => d.sourceId !== entry.sourceId || d.diffId === entry.diffId))
        await deleteOtherDiffs(entry.sourceId, entry.diffId)
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Last changes</h1>
            {list.map(d => (
                <DiffItem
                    key={d.diffId}
                    title={d.sourceId}
                    date={d.date}
                    diffText={d.diffText}
                    sourceUrl={d.sourceUrl}
                    hasSiblings={(idCounts[d.sourceId] ?? 0) > 1}
                    onDelete={() => handleDelete(d)}
                    onKeepOnly={() => handleKeepOnly(d)}
                />
            ))}
        </div>
    )
}
