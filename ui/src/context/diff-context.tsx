import {useState, type ReactNode, useEffect} from "react"
import {fetchDiffs} from "../services/api.ts"
import {DiffContext} from "./diff-state.ts"
import type {DiffEntry} from "../types/diff-entry.ts"

export function DiffProvider({children}: { children: ReactNode }) {
    const [diffs, setDiffs] = useState<DiffEntry[]>([])

    const refetch = async () => {
        const data = await fetchDiffs()
        setDiffs(data)
    }

    useEffect(() => {
        let cancelled = false

        fetchDiffs().then(data => {
            if (!cancelled) setDiffs(data)
        })

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <DiffContext.Provider value={{diffs, refetch}}>
            {children}
        </DiffContext.Provider>
    )
}
