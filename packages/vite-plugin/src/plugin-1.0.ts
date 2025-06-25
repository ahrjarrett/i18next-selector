export type { Json } from '@traversable/json'

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Plugin } from 'vite'
import type { TOptions } from 'i18next'

import { transformToTypeScript } from './transform.js'
import { walk } from './walk.js'
import type { transform } from './utils.js'

function log(...args: any[]) {
  console.debug('[@i18next-selector/vite-plugin]:', ...args)
}

/**
 * TODOs:
 * 
 * - [x]: Make sure it doesn't cause a loop if the source file is within a watched directory
 * - [x]: Add logging
 * - [x]: Add throttling
 * - [x]: Test in a real-world app
 * - [x]: Support multiple source files
 * - [x]: Make target file optional (default to `.d.ts` file in same directory)
 * - [ ]: Add test suite
 * - [ ]: Switch to async fs APIs
 * - [ ]: Support async?
 * - [ ]: Re-test in a real-world app
 */

export function i18nextVitePlugin({
  sourceDir,
  i18nextConfig,
  formatter,
  silent = false,
  timeout = 300,
}: i18nextVitePlugin.Options): Plugin {

  let throttled = false
  const config = {
    ...i18nextConfig,
    ...formatter && { formatter }
  } satisfies transform.Options

  const maps = walk(sourceDir, { match: (path) => path.endsWith('.json') })
    .map((sourceFile) => {
      const dirname = path.dirname(sourceFile)
      const split = sourceFile.split('/')
      const filename = split[split.length - 1]
      const targetFile = path.join(
        dirname,
        filename.endsWith('.json')
          ? filename.slice(0, -'.json'.length).concat('.d.ts')
          : filename.concat('.d.ts')
      )
      return {
        sourceFile,
        targetFile,
      }
    })

  return {
    name: 'vite-i18next-plugin',
    async buildStart() {
      /** TODO: add logging here */
      maps.forEach(({ sourceFile, targetFile }) => {
        fs.writeFileSync(
          targetFile,
          transformToTypeScript(
            fs.readFileSync(sourceFile).toString('utf8'),
            config,
          ),
        )
      })
    },
    configureServer({ watcher }) {
      maps.forEach(({ sourceFile, targetFile }) => {
        watcher.add(sourceFile)
        watcher.on('change', async (file) => {
          if (file === sourceFile) {
            if (!silent) log(`change detected, writing ${sourceFile}...`)
            /** TODO: add logging here */
            fs.writeFileSync(
              targetFile,
              transformToTypeScript(
                fs.readFileSync(sourceFile).toString('utf8'),
                config,
              ),
            )
          }
        })
      })
    },
    handleHotUpdate({ file, server }) {
      if (throttled) return
      throttled = true
      setTimeout(() => throttled = false, timeout)
      if (maps.some(({ sourceFile }) => file === sourceFile)) {
        if (!silent) log(`hot update detected, writing ${file}...`)
        server.hot.send({ type: 'full-reload' })
      }
    }
  }
}

export declare namespace i18nextVitePlugin {
  type Options = {
    sourceDir: string
    formatter?(source: string): string
    i18nextConfig?: TOptions
    timeout?: number
    silent?: boolean
    /** TODO: support async? */
    // i18nextConfigPath: fs.PathOrFileDescriptor
    // resources: Json
    // getResources?(): Json
  }
}
