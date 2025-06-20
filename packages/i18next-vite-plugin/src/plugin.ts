export type { Json } from '@traversable/json'
import type { Json } from '@traversable/json'

import * as fs from 'node:fs'
import type { Plugin } from 'vite'
import type { TOptions } from 'i18next'

import { transformToTypeScript } from './transform.js'

function log(...args: any[]) {
  console.debug('[i18next-vite-plugin]:', ...args)
}

/**
 * TODOs:
 * 
 * - [x]: Make sure it doesn't cause a loop if the source file is within a watched directory
 * - [x]: Add logging
 * - [x]: Add throttling
 * - [x]: Test in a real-world app
 * - [ ]: Make target file optional (default to `.d.ts` file in same directory)
 * - [ ]: Support multiple source files
 * - [ ]: Add test suite
 * - [ ]: Switch to async fs APIs
 * - [ ]: Support async?
 * - [ ]: Re-test in a real-world app
 */

export function i18nextVitePlugin({
  targetFile,
  sourceFile,
  i18nextConfig,
  formatter,
  silent = false,
  timeout = 300,
}: i18nextVitePlugin.Options): Plugin {
  let throttled = false
  const config = {
    ...i18nextConfig,
    ...formatter && { formatter }
  } satisfies transformToTypeScript.Options

  return {
    name: 'vite-i18next-plugin',
    async buildStart() {
      /** TODO: add logging here */
      fs.writeFileSync(
        targetFile,
        transformToTypeScript(
          fs.readFileSync(sourceFile).toString('utf8'),
          config,
        ),
      )
    },
    configureServer({ watcher }) {
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
    },
    handleHotUpdate({ file, server }) {
      if (throttled) return
      throttled = true
      setTimeout(() => throttled = false, timeout)
      if (file === sourceFile) {
        if (!silent) log(`hot update detected, writing ${sourceFile}...`)
        server.hot.send({ type: 'full-reload' })
      }
    }
  }
}

export declare namespace i18nextVitePlugin {
  type Options = {
    sourceFile: string
    targetFile: string
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
