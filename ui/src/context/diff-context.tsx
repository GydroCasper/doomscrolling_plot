import {useState, type ReactNode, useEffect} from "react"
import {subscribeToDiffs, subscribeToLastRun} from "../services/diff-query-service.ts"
import {DiffContext} from "./diff-state.ts"
import type {DiffEntry} from "../types/diff-entry.ts"

export function DiffProvider({children}: { children: ReactNode }) {
    const [diffs, setDiffs] = useState<DiffEntry[]>([])
    const [lastRunAt, setLastRunAt] = useState<string | null>()

    useEffect(() => {
        return subscribeToDiffs(setDiffs, error => {
            console.error("Failed to subscribe to diffs", error)
        })
    }, [])

    useEffect(() => {
        return subscribeToLastRun(setLastRunAt, error => {
            console.error("Failed to subscribe to last crawler run", error)
            setLastRunAt(null)
        })
    }, [])

    return (
        <DiffContext.Provider value={{diffs, lastRunAt}}>
            {children}
        </DiffContext.Provider>
    )
}
