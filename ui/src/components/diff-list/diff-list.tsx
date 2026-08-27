import {DiffItem} from "../diff-item/diff-item.tsx"
import {NewDiffSection} from "../new-diff-section/new-diff-section.tsx"
import {styles} from "./diff-list.styles.tsx"
import {useDiff} from "../../context/diff-state.ts"
import {deleteDiff, deleteOtherDiffs, markDiffsReviewed} from "../../services/api.ts"
import type {DiffEntry} from "../../types/diff-entry.ts"

export function DiffList() {
    const {diffs, refetch} = useDiff()
    const newDiffs = diffs.filter(diff => diff.reviewedAt === null)
    const reviewedDiffs = diffs.filter(diff => diff.reviewedAt !== null)

    const idCounts = diffs.reduce<Record<string, number>>((acc, d) => {
        acc[d.sourceId] = (acc[d.sourceId] ?? 0) + 1
        return acc
    }, {})

    const handleDelete = async (entry: DiffEntry) => {
        await deleteDiff(entry.diffId)
        await refetch()
    }

    const handleKeepOnly = async (entry: DiffEntry) => {
        await deleteOtherDiffs(entry.sourceId, entry.diffId)
        await refetch()
    }

    const handleReviewAll = async (diffIds: string[]) => {
        await markDiffsReviewed(diffIds)
        await refetch()
    }

    const renderDiff = (diff: DiffEntry) => (
        <DiffItem
            key={diff.diffId}
            title={diff.sourceId}
            date={diff.date}
            diffText={diff.diffText}
            sourceUrl={diff.sourceUrl}
            hasSiblings={(idCounts[diff.sourceId] ?? 0) > 1}
            onDelete={() => handleDelete(diff)}
            onKeepOnly={() => handleKeepOnly(diff)}
        />
    )

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Last changes</h1>
            <NewDiffSection
                diffIds={newDiffs.map(diff => diff.diffId)}
                onReviewAll={handleReviewAll}
            >
                {newDiffs.map(renderDiff)}
            </NewDiffSection>
            {reviewedDiffs.map(renderDiff)}
        </div>
    )
}
