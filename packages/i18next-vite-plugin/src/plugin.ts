export type { Json } from '@traversable/json'

import * as fs from 'node:fs'
import type { Plugin } from 'vite'
import type { Json } from '@traversable/json'
import type { TOptions } from 'i18next'

import { transformToTypeScript } from './transform.js'

/**
 * TODOs:
 * 
 * - [ ]: Add test suite
 * - [ ]: Test in a real-world app
 * - [ ]: Switch to async fs APIs
 * - [ ]: Make sure it doesn't cause a loop if the source file is within a watched directory
 * - [ ]: Add logging
 * - [ ]: Add throttling?
 * - [ ]: Support async?
 */

export function i18nextSelectorPlugin({
  targetFile,
  sourceFile,
  i18nextConfig,
  formatter,
}: i18nextSelectorPlugin.Options): Plugin {
  const config = {
    ...i18nextConfig,
    ...formatter && { formatter }
  } satisfies transformToTypeScript.Options

  return {
    name: 'vite-i18next-plugin',
    configureServer({ watcher }) {
      watcher.add(sourceFile)
      watcher.on('change', async (file) => {
        if (file === sourceFile) {
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
  }
}

export declare namespace i18nextSelectorPlugin {
  type Json =
    | undefined
    | null
    | boolean
    | number
    | string
    | readonly Json[]
    | { [x: string]: Json }

  type Options = {
    targetFile: string
    sourceFile: string
    formatter?(source: string): string
    i18nextConfig?: TOptions
    /** TODO: support async? */
    // i18nextConfigPath: fs.PathOrFileDescriptor
    // resources: Json
    // getResources?(): Json
  }
}
