import type {CSSProperties} from "react"

export const styles: Record<string, CSSProperties> = {
    page: {
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        background: "#1e1e1e",
        color: "#fff"
    },
    card: {
        width: "min(28rem, calc(100vw - 3rem))",
        padding: "2rem",
        border: "1px solid #3f3f46",
        borderRadius: "12px",
        background: "#27272a",
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
        textAlign: "center"
    },
    title: {
        marginTop: 0,
        fontSize: "1.75rem"
    },
    description: {
        marginBottom: "1.5rem",
        color: "#a1a1aa"
    },
    error: {
        marginTop: "1rem",
        color: "#fca5a5"
    },
    userBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "1rem",
        padding: "0.75rem 2rem",
        borderBottom: "1px solid #3f3f46",
        background: "#18181b",
        color: "#d4d4d8"
    }
}
