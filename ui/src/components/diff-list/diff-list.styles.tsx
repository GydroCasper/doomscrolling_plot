import type {CSSProperties} from "react"

export const styles: Record<string, CSSProperties> = {
    container: {
        padding: '2rem',
        background: '#1e1e1e',
        minHeight: '100vh',
    },
    title: {
        color: '#fff'
    },
    newSection: {
        marginBottom: '2rem',
        padding: '1rem',
        border: '1px solid #3f3f46',
        borderRadius: '8px',
        background: '#27272a'
    },
    newHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
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
        color: '#a1a1aa'
    },
    reviewButton: {
        flexShrink: 0,
        border: '1px solid #22c55e',
        background: '#14532d',
        color: '#bbf7d0'
    },
    reviewError: {
        marginTop: '0.75rem',
        color: '#fca5a5'
    },
    newContent: {
        marginTop: '1.5rem'
    },
    emptyNew: {
        color: '#a1a1aa',
        fontSize: '1.05rem'
    }
}
