import {useState, type ReactNode, useEffect} from "react"
import {subscribeToDiffs} from "../services/diff-query-service.ts"
import {DiffContext} from "./diff-state.ts"
import type {DiffEntry} from "../types/diff-entry.ts"

export function DiffProvider({children}: { children: ReactNode }) {
    const [diffs, setDiffs] = useState<DiffEntry[]>([])

    useEffect(() => {
        return subscribeToDiffs(setDiffs, error => {
            console.error("Failed to subscribe to diffs", error)
        })
    }, [])

    return (
        <DiffContext.Provider value={{diffs}}>
            {children}
        </DiffContext.Provider>
    )
}
