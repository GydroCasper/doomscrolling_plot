import {useEffect, useRef, useState} from "react"
import {startGrabbing} from "../../services/api.ts"
import {styles} from "./header.styles.ts"

export function Header() {
    const [running, setRunning] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const logsRef = useRef<HTMLPreElement>(null)

    // Auto-scroll to bottom when logs update
    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight
        }
    }, [logs])

    const streaming = (message: string) => {
        setLogs(prev => [...prev, message])
    }

    const handleRun = async () => {
        setRunning(true)
        setLogs([])
        try {
            await startGrabbing(streaming)
        } finally {
            setRunning(false)
        }
    }

    return (
        <header>
            <div>
                <button onClick={handleRun} disabled={running}>
                    {running ? 'Running...' : 'Run Grabber'}
                </button>
            </div>
            {logs.length > 0 && (
                <pre
                    ref={logsRef}
                    style={styles.logs}
                >
                      {logs.join('\n')}
                  </pre>
            )}
        </header>
    )
}