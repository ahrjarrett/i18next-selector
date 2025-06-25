import * as fs from 'node:fs'
import type { Json } from '@traversable/json'

import { transformToTypeScript } from './transform.js'
import { transform } from './utils.js'


export function writeFromFile(options: writeFromFile.Options): () => void {
  const sourceFile = fs.readFileSync(options.sourceFile).toString('utf8')
  return () => fs.writeFileSync(
    options.targetFile,
    transformToTypeScript(sourceFile, options),
  )
}

export declare namespace writeFromFile {
  export interface Options extends transform.Options {
    sourceFile: string
    targetFile: fs.PathOrFileDescriptor
  }
}

export function writeFromSource(options: writeFromSource.Options): () => void {
  return () => fs.writeFileSync(
    options.targetFile,
    transformToTypeScript(options.source, options)
  )
}

export declare namespace writeFromSource {
  export interface Options extends transform.Options {
    source: string | readonly Json[] | { [x: string]: Json }
    targetFile: fs.PathOrFileDescriptor
  }
}

export function writeFromAsyncSource(options: writeFromAsyncSource.Options) {
  return () => options.source.then((source) => {
    return fs.writeFileSync(options.targetFile, transformToTypeScript(source, options))
  })
}

export declare namespace writeFromAsyncSource {
  export interface Options extends transform.Options {
    source: Promise<string | readonly Json[] | { [x: string]: Json }>
    targetFile: fs.PathOrFileDescriptor
  }
}

