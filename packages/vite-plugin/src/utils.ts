import type { TOptions } from 'i18next'
import { Json } from '@traversable/json'

import { defaultOptions, pluralSuffixes } from './constants.js'

export type JustURI = typeof JustURI
export const JustURI = Symbol.for('@i18next-selector/vite-plugin/Just')

export type NothingURI = typeof NothingURI
export const NothingURI = Symbol.for('@i18next-selector/vite-plugin/Nothing')

export type Maybe<T> = Just<T> | Nothing
export interface Just<T> { _tag: JustURI, value: T }
export interface Nothing { _tag: NothingURI }

export const isJust = <T>(x: unknown): x is Just<T> => x !== null && typeof x === 'object' && '_tag' in x && x._tag === JustURI
export const isNothing = (x: unknown): x is Nothing => x !== null && typeof x === 'object' && '_tag' in x && x._tag === NothingURI

export function just<T>(x: T): Maybe<T> { return { _tag: JustURI, value: x } }
export function nothing<T>(): Maybe<T> { return { _tag: NothingURI } }

export type LeftURI = typeof LeftURI
export const LeftURI = Symbol.for('@i18next-selector/vite-plugin/Left')

export type RightURI = typeof RightURI
export const RightURI = Symbol.for('@i18next-selector/vite-plugin/Right')

export type Either<L, R> = Left<L> | Right<R>
export interface Left<L> { _tag: LeftURI, left: L }
export interface Right<R> { _tag: RightURI, right: R }

export const isLeft = <T>(x: unknown): x is Left<T> => x !== null && typeof x === 'object' && '_tag' in x && x._tag === LeftURI
export const isRight = <T>(x: unknown): x is Right<T> => x !== null && typeof x === 'object' && '_tag' in x && x._tag === RightURI

export function left<L>(x: L): Left<L> { return { _tag: LeftURI, left: x } }
export function right<R>(x: R): Right<R> { return { _tag: RightURI, right: x } }

export function either<L, R, T>(onLeft: (x: L) => T, onRight: (x: R) => T): (x: Either<L, R>) => T {
  return (x) => isLeft(x) ? onLeft(x.left) : onRight(x.right)
}

export type GroupedTypeScriptPluralKeys<T = unknown> = Record<
  string,
  Either<
    { key: string, jsdocs: string[], value: string[] },
    { key: string, jsdocs: string[], value: T }
  >
>

export declare namespace transform {
  interface Options extends TOptions {
    pluralSeparator?: string
    formatCmd?: string
  }
}

export const isPluralKey = (key: string, { pluralSeparator = defaultOptions.pluralSeparator }: TOptions) => pluralSuffixes
  .map((suffix) => `${pluralSeparator}${suffix}`)
  .some((suffix) => key.endsWith(suffix) || key.slice(1, -1).endsWith(suffix))

export const isPluralEntry
  : (options: transform.Options) => (entry: [string, unknown]) => entry is [string, Json.Scalar]
  = (options) => (entry): entry is never => Json.isScalar(entry[1]) && isPluralKey(entry[0], options)

export function rmPluralization(entry: [string, unknown], options: transform.Options): Maybe<string> {
  if (!isPluralEntry(options)(entry)) return nothing()
  else {
    const [key] = entry
    const index = key.lastIndexOf(options.pluralSeparator ?? defaultOptions.pluralSeparator)
    let sliced = key.slice(0, index)
    if (
      sliced.startsWith('"') && !sliced.endsWith('"')
      || sliced.startsWith("'") && !sliced.endsWith("'")
    ) {
      sliced = `${sliced}${sliced[0]}`
    }
    return just(sliced)
  }
}

export const isJsonFile = (x: string) => x.endsWith('.json')
export const isYamlFile = (x: string) => x.endsWith('.yml') || x.endsWith('.yaml')
export const isTsDeclarationFile = (x: string) => x.endsWith('.d.ts')
export const isTsFile = (x: string) => x.endsWith('.ts') && !isTsDeclarationFile(x)

export function mergeJsdocs(jsdocs: string[], OFFSET: string) {
  return jsdocs.length === 0 ? ''
    : jsdocs.length === 1
      ? jsdocs.includes('\n')
        ? jsdocs
        : `${jsdocs}\n${OFFSET}`
      : `\n${OFFSET}/**\n${OFFSET} *${jsdocs.map(
        (doc, i) => {
          const sliced = doc.startsWith('/**') && doc.endsWith('*/') ? doc.slice('/**'.length, -'*/'.length) : doc
          return sliced.includes('\n')
            ? `${`\n${OFFSET} `}${sliced.trim()}${i === jsdocs.length - 1 ? '' : `\n${OFFSET} *`}`
            : `${i === 0 ? '' : `\n${OFFSET} *`}${sliced}${i === jsdocs.length - 1 ? '' : `\n${OFFSET} *`}`
        }
      ).join('')
      }\n${OFFSET} */\n`
}
