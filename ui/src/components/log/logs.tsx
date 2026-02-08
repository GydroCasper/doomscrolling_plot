import {useEffect, useRef} from "react"
import {styles} from "./logs.styles.ts"

interface LogsProps {
    logs: string[]
    open: boolean
    setOpen: (open: boolean) => void
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
                  {logs.join('\n')}
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
