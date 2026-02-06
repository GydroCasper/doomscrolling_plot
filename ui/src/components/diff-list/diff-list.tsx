import {useEffect, useState} from "react"
import {DiffItem} from "../diff-item/diff-item.tsx"
import {styles} from "./diff-list.styles.tsx"
import {fetchDiffs} from "../../services/api.ts"

type DiffEntry = {
    id: string;
    date: string;
    oldValue: string;
    newValue: string;
    diffText: string;
};

export function DiffList() {
    const [diffs, setDiffs] = useState<DiffEntry[]>([])

    useEffect(() => {
        fetchDiffs().then(
            diffs => setDiffs(diffs)
        )
    }, [])

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Last changes</h1>
            {diffs.map(d => (
                <DiffItem
                    key={`${d.id}-${d.date}`}
                    title={d.id}
                    date={d.date}
                    diffText={d.diffText}
                />
            ))}
        </div>
    )
}