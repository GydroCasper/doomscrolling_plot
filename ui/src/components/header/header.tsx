import {useState} from "react"
import {startGrabbing} from "../../services/api.ts"

export function Header() {
    const [running, setRunning] = useState(false)

    const handleRun = async () => {
        setRunning(true)
        try {
            await startGrabbing()
        } finally {
            setRunning(false)
        }
    }

    return (
        <header>
            <button onClick={handleRun} disabled={running}>
                {running ? 'Running...' : 'Run Grabber'}
            </button>
        </header>
    )
}