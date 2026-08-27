import {createContext, useContext} from "react"
import type {DiffEntry} from "../types/diff-entry.ts"

type DiffContextType = {
    diffs: DiffEntry[]
    refetch: () => Promise<void>
}

export const DiffContext = createContext<DiffContextType | null>(null)

export function useDiff() {
    const context = useContext(DiffContext)
    if (!context) throw new Error("useDiff must be used within DiffProvider")
    return context
}
