import type {CSSProperties} from "react"

export const styles: Record<string, CSSProperties> = {
    container: {
        position: 'relative'
    },
    logs: {
        maxHeight: '160px',  // ~8 rows
        overflow: 'auto',
        margin: '0.5rem 0',
        fontSize: '12px',
        lineHeight: '20px',
        padding: '2rem',
    },
    collapsible: {
        display: 'flex',
        justifyContent: 'center'
    },
    collapsibleButton: {
        cursor: 'pointer',
        background: '#333',
        padding: '2px 12px',
        fontSize: '12px'
    },
    borderRadiusOpenButton: {
        borderRadius: '4px 4px 0 0'
    },
    borderRadiusClosedButton: {
        borderRadius: '4px'
    }
}