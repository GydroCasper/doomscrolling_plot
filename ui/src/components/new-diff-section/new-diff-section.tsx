import {useState, type ReactNode} from "react"
import {styles} from "./new-diff-section.styles.ts"

type Props = {
    diffIds: string[]
    onReviewAll: (diffIds: string[]) => Promise<void>
    children: ReactNode
}

export function NewDiffSection({diffIds, onReviewAll, children}: Props) {
    const [open, setOpen] = useState(true)
    const [reviewing, setReviewing] = useState(false)
    const [reviewError, setReviewError] = useState(false)

    const handleReviewAll = async () => {
        setReviewing(true)
        setReviewError(false)
        try {
            await onReviewAll(diffIds)
        } catch {
            setReviewError(true)
        } finally {
            setReviewing(false)
        }
    }

    return (
        <section style={diffIds.length === 0 ? styles.emptyContainer : styles.container}>
            {diffIds.length === 0 ? (
                <div style={styles.empty}>No new changes</div>
            ) : (
                <>
                    <div style={styles.header}>
                        <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpen(value => !value)}
                            style={styles.collapseButton}
                        >
                            <span style={styles.chevron}>{open ? '▾' : '▸'}</span>
                            New changes · {diffIds.length}
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
                    {reviewError && <div style={styles.error}>Could not mark changes as reviewed.</div>}
                    {open && <div style={styles.content}>{children}</div>}
                </>
            )}
        </section>
    )
}
