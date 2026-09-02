import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {execFileSync} from 'node:child_process'

const commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim()
const dirty = execFileSync('git', ['status', '--porcelain'], {encoding: 'utf8'}).trim().length > 0
const builtAt = new Date().toISOString()

if (process.env.BUILD_REQUIRE_CLEAN === '1' && dirty) {
  throw new Error('Refusing to create a deploy build from a dirty Git working tree. Commit or stash the changes first.')
}

const buildInfo = {commit, dirty, builtAt}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  plugins: [
    react(),
    {
      name: 'build-version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: `${JSON.stringify(buildInfo, null, 2)}\n`,
        })
      },
    },
  ],
})
