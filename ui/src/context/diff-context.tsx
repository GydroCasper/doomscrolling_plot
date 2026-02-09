import {createContext, useContext, useState, type ReactNode, useEffect} from "react"
import type {DiffEntry} from "../types/diff-entry.ts"
import {fetchDiffs} from "../services/api.ts"

interface DiffContextType {
    diffs: DiffEntry[]
    refetch: () => Promise<void>
}

const DiffContext = createContext<DiffContextType | null>(null)

export function DiffProvider({children}: { children: ReactNode }) {
    const [diffs, setDiffs] = useState<DiffEntry[]>([])

    const refetch = async () => {
        const data = await fetchDiffs()
        setDiffs(data)
    }

    useEffect(() => {
        refetch()
    }, [])

    return (
        <DiffContext.Provider value={{diffs, refetch}}>
            {children}
        </DiffContext.Provider>
    )
}

export function useDiff() {
    const context = useContext(DiffContext)
    if (!context) throw new Error("useDiff must be used within DiffProvider")
    return context
}