import type {CSSProperties} from "react"

export const styles: Record<string, CSSProperties> = {
    container: {
        marginBottom: '2rem',
        overflowX: 'auto'
    },
    title: {
        color: '#fff'
    },
    date: {
        color: '#888'
    },
    keepOnlyButton: {
        marginLeft: '0.75rem',
        fontSize: '0.75rem',
        padding: '2px 8px',
        cursor: 'pointer',
        background: '#7f1d1d',
        border: '1px solid #ef4444',
        borderRadius: '4px',
        color: '#fca5a5',
        verticalAlign: 'middle',
        fontWeight: 'bold'
    },
    sourceUrl: {
        marginBottom: '0.5rem',
        fontSize: '0.8rem'
    },
    sourceLink: {
        color: '#60a5fa',
        textDecoration: 'none',
        wordBreak: 'break-all'
    }
}