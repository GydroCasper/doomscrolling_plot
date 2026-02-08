import {useState} from "react"
import {startGrabbing} from "../../services/api.ts"
import {Logs} from "../log/logs.tsx"

export function Header() {
    const [running, setRunning] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [logsOpen, setLogsOpen] = useState(true)

    const streaming = (message: string) => {
        setLogs(prev => [...prev, message])
    }

    const handleRun = async () => {
        setRunning(true)
        setLogs([])
        setLogsOpen(true)
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
            {logs.length > 0 && <Logs logs={logs} open={logsOpen} setOpen={setLogsOpen}/>}
        </header>
    )
}