import type {CSSProperties} from "react"

export const styles: Record<string, CSSProperties> = {
    container: {
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
    error: {
        marginTop: '0.75rem',
        color: '#fca5a5'
    },
    content: {
        marginTop: '1.5rem'
    },
    empty: {
        color: '#a1a1aa',
        fontSize: '1.05rem'
    }
}
