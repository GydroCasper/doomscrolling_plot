import {DiffList} from "./components/diff-list/diff-list.tsx"
import {Header} from "./components/header/header.tsx"
import {DiffProvider} from "./context/diff-context.tsx"

function App() {
    return (
        <DiffProvider>
            <Header/>
            <DiffList/>
        </DiffProvider>
    )
}

export default App