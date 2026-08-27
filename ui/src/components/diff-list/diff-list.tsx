import {useState} from "react"
import {DiffItem} from "../diff-item/diff-item.tsx"
import {styles} from "./diff-list.styles.tsx"
import {useDiff} from "../../context/diff-state.ts"
import {deleteDiff, deleteOtherDiffs, markDiffsReviewed} from "../../services/api.ts"
import type {DiffEntry} from "../../types/diff-entry.ts"

export function DiffList() {
    const {diffs, refetch} = useDiff()
    const [newOpen, setNewOpen] = useState(true)
    const [reviewing, setReviewing] = useState(false)
    const [reviewError, setReviewError] = useState(false)
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

    const handleReviewAll = async () => {
        const diffIds = newDiffs.map(diff => diff.diffId)
        if (diffIds.length === 0) return

        setReviewing(true)
        setReviewError(false)
        try {
            await markDiffsReviewed(diffIds)
            await refetch()
        } catch {
            setReviewError(true)
        } finally {
            setReviewing(false)
        }
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
            <section style={styles.newSection}>
                {newDiffs.length === 0 ? (
                    <div style={styles.emptyNew}>No new changes</div>
                ) : (
                    <>
                        <div style={styles.newHeader}>
                            <button
                                type="button"
                                aria-expanded={newOpen}
                                onClick={() => setNewOpen(open => !open)}
                                style={styles.collapseButton}
                            >
                                <span style={styles.chevron}>{newOpen ? '▾' : '▸'}</span>
                                New changes · {newDiffs.length}
                            </button>
                            <button
                                type="button"
                                onClick={handleReviewAll}
                                disabled={reviewing}
                                style={styles.reviewButton}
                            >
                                {reviewing ? 'Marking...' : 'Mark all as reviewed'}
                            </button>
                        </div>
                        {reviewError && <div style={styles.reviewError}>Could not mark changes as reviewed.</div>}
                        {newOpen && <div style={styles.newContent}>{newDiffs.map(renderDiff)}</div>}
                    </>
                )}
            </section>
            {reviewedDiffs.map(renderDiff)}
        </div>
    )
}
