import {DiffList} from "./components/diff-list/diff-list.tsx"
import {Header} from "./components/header/header.tsx"
import {DiffProvider} from "./context/diff-context.tsx"
import {AuthGate} from "./components/auth/auth-gate.tsx"

function App() {
    return (
        <AuthGate>
            <DiffProvider>
                <Header/>
                <DiffList/>
            </DiffProvider>
        </AuthGate>
    )
}

export default App
