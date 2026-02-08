import {useEffect, useRef} from "react"
import {styles} from "./logs.styles.ts"

interface LogsProps {
    logs: string[]
    open: boolean
    setOpen: (open: boolean) => void
}

function getLogColor(log: string): string {
    if (log.includes('CHANGED')) return '#3fb950'      // green
    if (log.includes('skipped')) return '#848d97'      // gray
    if (log.includes('ERROR')) return '#f85149'        // red
    if (log.includes('CREATED')) return '#3fb950'      // blue
    return '#e6edf3'                                               // default
}

export function Logs({logs, open, setOpen}: LogsProps) {
    const logsRef = useRef<HTMLPreElement>(null)

    // Auto-scroll to bottom when logs update
    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight
        }
    }, [logs])

    const collapsibleButtonBorderRadius = open ? styles.borderRadiusOpenButton : styles.borderRadiusClosedButton
    return <div style={styles.container}>
        {open && (
            <pre ref={logsRef} style={styles.logs}>
                {logs.map((log, i) => (
                    <div key={i} style={{color: getLogColor(log)}}>
                        {log}
                    </div>
                ))}
              </pre>
        )}
        <div style={styles.collapsible}>
            <div
                onClick={() => setOpen(!open)}
                style={{...styles.collapsibleButton, ...collapsibleButtonBorderRadius}}
            >
                {open ? '▲' : '▼'}
            </div>
        </div>
    </div>
}
