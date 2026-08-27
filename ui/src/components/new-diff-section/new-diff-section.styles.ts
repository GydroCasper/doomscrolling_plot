import type {CSSProperties} from "react"

export const styles: Record<string, CSSProperties> = {
    container: {
        marginBottom: '2rem',
        overflow: 'hidden',
        border: '2px solid #7dd3fc',
        borderRadius: '10px',
        background: '#303844',
        boxShadow: 'inset 5px 0 0 #bae6fd, 0 10px 28px rgba(0, 0, 0, 0.32)'
    },
    emptyContainer: {
        marginBottom: '2rem',
        padding: '1rem',
        border: '1px solid #3f3f46',
        borderRadius: '8px',
        background: '#27272a'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1rem',
        background: '#3b4960',
        borderBottom: '2px solid #64748b'
    },
    collapseButton: {
        padding: 0,
        border: 0,
        background: 'transparent',
        color: '#fff',
        fontSize: '1.2rem',
        fontWeight: 700,
        textAlign: 'left'
    },
    chevron: {
        display: 'inline-block',
        width: '1.25rem',
        color: '#bae6fd'
    },
    reviewButton: {
        flexShrink: 0,
        border: '1px solid #22c55e',
        background: '#14532d',
        color: '#bbf7d0'
    },
    error: {
        marginTop: '0.75rem',
        color: '#fca5a5'
    },
    content: {
        padding: '1.5rem 1rem 1rem'
    },
    empty: {
        color: '#a1a1aa',
        fontSize: '1.05rem'
    }
}
