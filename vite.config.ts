import * as path from 'node:path'
import { defineConfig } from 'vitest/config'
import { PACKAGES } from './config/__generated__/package-list.js'

function createAlias(pkgName: string) {
  return {
    [`@${pkgName}/test`]: path.join(__dirname, 'packages', pkgName, 'test'),
    [`@${pkgName}`]: path.join(__dirname, 'packages', pkgName, 'src'),
  }
}

const ALIASES = [...PACKAGES]
  .filter((v) => v.startsWith('packages/'))
  .map(v => v.slice('packages/'.length))
  .map(createAlias)
  .reduce((acc, cur) => ({ ...acc, ...cur }), {})

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  build: {},
  test: {
    alias: ALIASES,
    disableConsoleIntercept: true,
    fakeTimers: { toFake: undefined },
    slowTestThreshold: 750,
    /** 
     * To run typelevel benchmarks:
     * 
     * 1. uncomment these lines
     * 2. add back the `include` line in {@link examples/benchmarks/vite.config.ts}
     * 3. run `pnpm test`
     */
    // globalSetup: [fileURLToPath(new URL('./setupVitest.ts', import.meta.url))],
    // include: ['test/**/*.test.ts'],
    printConsoleTrace: true,
    sequence: { concurrent: true },
    workspace: [
      'benchmarks/*',
      'packages/*',
      'bin',
    ],
  },
})

