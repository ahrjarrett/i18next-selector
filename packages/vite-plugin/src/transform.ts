import { Json } from '@traversable/json'
import type { TOptions } from 'i18next'

import * as T from './options.js'
import type {
  transform,
} from './utils.js'
import {  } from './utils.js'
import { defaultOptions } from './constants.js'

export const pluralSuffixes = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
]

export const isPluralKey = (key: string, { pluralSeparator = defaultOptions.pluralSeparator }: TOptions) => pluralSuffixes
  .map((suffix) => `${pluralSeparator}${suffix}`)
  .some((suffix) => key.endsWith(suffix))

export const isPluralEntry
  : (options: transform.Options) => (entry: [string, unknown]) => entry is [string, Json.Scalar]
  = (options) => (entry): entry is never => Json.isScalar(entry[1]) && isPluralKey(entry[0], options)

export function rmPluralization(entry: [string, unknown], options: transform.Options): T.Maybe<string> {
  if (!isPluralEntry(options)(entry)) return T.nothing()
  else {
    const [key] = entry
    const index = key.lastIndexOf(options.pluralSeparator ?? defaultOptions.pluralSeparator)
    return T.just(key.slice(0, index))
  }
}

export function groupPluralKeys(entries: [string, unknown][], options: transform.Options): Record<string, T.Either<string[], unknown>> {
  return entries.reduce(
    (acc, [k, v]) => {
      const maybe = rmPluralization([k, v], options)
      if (T.isNothing(maybe)) {
        acc[k] = T.right(v)
        return acc
      } else {
        const depluralized = maybe.value
        if (depluralized in acc) {
          const either = acc[depluralized]
          if (T.isLeft(either)) {
            acc[depluralized] = T.left([...either.left, String(v)])
            return acc
          } else {
            const msg = '\n\r\
              [@i18next-selector/vite-plugin/transform]:\n\r\
              \'groupPluralKeys\' received a non-JSON value.\n\r'
            console.error(
              msg + '\n\r\
              If the value logged below is in fact a valid JSON value, this is probably a bug.\
              Value:\n\r',
              either.right,
            )
            throw Error(msg)
          }
        } else {
          acc[depluralized] = T.left([String(v)])
          return acc
        }
      }
    },
    {} as Record<string, T.Either<string[], unknown>>
  )
}

export function parse(x: Json, $: transform.Options): string | readonly Json[] | { [x: string]: T.Either<string[], Json> }
export function parse(x: Json, $: transform.Options) {
  return unparse(Json.fold((x) => {
    switch (true) {
      default: return x satisfies never
      case Json.isScalar(x): return typeof x === 'string' ? `"${x}"` : String(x)
      case Json.isArray(x): return x
      case Json.isObject(x): {
        return groupPluralKeys(Object.entries(x), $)
      }
    }
  })(x))
}

export function unparse(xs: unknown) {
  return Json.fold((x) => {
    switch (true) {
      default: return x
      case T.isRight(x): return x.right
      case T.isLeft(x): {
        if (Json.isArray(x.left)) return x.left.join(' | ')
        else {
          const msg = '\n\r\
          [@i18next-selector/vite-plugin/transform]:\n\r\
          \'unparse\' received a left value that wasn\'t an array of string.\n\r'
          console.error(
            msg + '\n\r\
            If the value logged below is in fact, an array of strings, this is probably a bug.\
            Value:\n\r',
            x.left,
          )
          throw Error(msg)
        }
      }
    }
  })(xs as never)
}

export function stringify(xs: unknown): string {
  return Json.fold<string>((xs) => {
    switch (true) {
      default: return xs satisfies never
      case Json.isScalar(xs): return String(xs)
      case Json.isArray(xs): return `[${xs.join(',')}]`
      case Json.isObject(xs): {
        return `{ ${Object.entries(xs).map(([k, v]) => `"${k}": ${v}`).join(',')} }`
      }
    }
  })(xs as never)
}

export function transformToJson(json: { [x: string]: Json } | readonly Json[] | string, options?: transform.Options) {
  const config = {
    pluralSeparator: options?.pluralSeparator || defaultOptions.pluralSeparator,
  } satisfies TOptions

  if (typeof json !== 'string') return stringify(parse(json, config))
  else {
    try { return transformToJson(JSON.parse(json)) }
    catch (e) {
      const msg = '\n\r\
      [@i18next-selector/vite-plugin/transform]:\n\r\
      \'transformToJson\' received a string, but failed to parse the string as JSON.\n\r'
      console.error(
        msg,
        'Here\'s the error we got:\n\r',
        e,
      )
      throw Error(msg)
    }
  }
}

export function transformToTypeScript(
  json: { [x: string]: Json } | readonly Json[] | string,
  options?: transform.Options
) {
  return `export declare const resources: ${transformToJson(json, options)}`
}
