import {DiffItem} from "../diff-item/diff-item.tsx"
import {styles} from "./diff-list.styles.tsx"
import {useDiff} from "../../context/diff-context.tsx"

export function DiffList() {
    const {diffs} = useDiff()

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