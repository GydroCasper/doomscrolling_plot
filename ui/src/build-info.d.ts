interface BuildInfo {
    commit: string
    dirty: boolean
    builtAt: string
}

declare const __BUILD_INFO__: BuildInfo
