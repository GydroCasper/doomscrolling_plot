import {useState} from "react"
import {startGrabbing} from "../../services/api.ts"

export function Header() {
    const [running, setRunning] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

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
                <pre>
                    {logs.join('\n')}
                </pre>
                )}
        </header>
    )
}