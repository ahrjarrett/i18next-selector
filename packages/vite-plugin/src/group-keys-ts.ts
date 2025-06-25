import type {
  GroupedTypeScriptPluralKeys,
  transform,
} from './utils.js'

import {
  rmPluralization,
  isNothing,
  right,
  isLeft,
  left,
} from './utils.js'

import { PLUGIN_HEADER } from './constants.js'

export function groupTypeScriptPluralKeys(
  entries: { jsdoc: string | null, key: string, value: unknown }[],
  options: transform.Options
): GroupedTypeScriptPluralKeys {
  return entries.reduce(
    (acc, { key, value, jsdoc }) => {
      const maybe = rmPluralization([key, value], options)
      if (isNothing(maybe)) {
        const jsdocs = [jsdoc].filter((doc) => doc !== null)
        acc[key] = right({ key, jsdocs, value })
        return acc
      } else {
        const depluralized = maybe.value
        if (depluralized in acc) {
          const either = acc[depluralized]
          if (isLeft(either)) {
            const prevJsdocs = either.left.jsdocs === null ? [] : either.left.jsdocs
            const jsdocs = [...prevJsdocs, jsdoc].filter((doc) => doc !== null)
            acc[depluralized] = left({ key, jsdocs, value: [...either.left.value, String(value)] })
            return acc
          } else {
            const msg = '\n\r'
              + PLUGIN_HEADER
              + '\n\r\
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
          const jsdocs = [jsdoc].filter((doc) => doc !== null)
          acc[depluralized] = left({ key, jsdocs, value: [String(value)] })
          return acc
        }
      }
    },
    {} as GroupedTypeScriptPluralKeys
  )
}

