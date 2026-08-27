import {useEffect, useState, type ReactNode} from "react"
import {GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User} from "firebase/auth"
import {auth} from "../../firebase.ts"
import {styles} from "./auth-gate.styles.ts"

export function AuthGate({children}: {children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [signingIn, setSigningIn] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => onAuthStateChanged(auth, nextUser => {
        setUser(nextUser)
        setLoading(false)
    }, () => {
        setError("Could not check authentication status.")
        setLoading(false)
    }), [])

    const handleSignIn = async () => {
        setSigningIn(true)
        setError(null)

        try {
            await signInWithPopup(auth, new GoogleAuthProvider())
        } catch {
            setError("Google sign-in failed.")
        } finally {
            setSigningIn(false)
        }
    }

    if (loading) {
        return <main style={styles.page}>Checking access…</main>
    }

    if (!user) {
        return (
            <main style={styles.page}>
                <section style={styles.card}>
                    <h1 style={styles.title}>Doomscrolling Plot</h1>
                    <p style={styles.description}>Sign in with an authorized Google account to view changes.</p>
                    <button onClick={handleSignIn} disabled={signingIn}>
                        {signingIn ? "Signing in…" : "Sign in with Google"}
                    </button>
                    {error && <div style={styles.error}>{error}</div>}
                </section>
            </main>
        )
    }

    return (
        <>
            <div style={styles.userBar}>
                <span>{user.email}</span>
                <button onClick={() => signOut(auth)}>Sign out</button>
            </div>
            {children}
        </>
    )
}
