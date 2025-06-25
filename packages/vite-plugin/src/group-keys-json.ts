import { PLUGIN_HEADER } from './constants.js'
import type { Either, transform } from './utils.js'
import { right, isLeft, rmPluralization, isNothing, left } from './utils.js'

export function groupJsonPluralKeys(
  entries: [string, unknown][],
  options: transform.Options
): Record<string, Either<string[], unknown>> {
  return entries.reduce(
    (acc, [k, v]) => {
      const maybe = rmPluralization([k, v], options)
      if (isNothing(maybe)) {
        acc[k] = right(v)
        return acc
      } else {
        const depluralized = maybe.value
        if (depluralized in acc) {
          const either = acc[depluralized]
          if (isLeft(either)) {
            acc[depluralized] = left([...either.left, String(v)])
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
          acc[depluralized] = left([String(v)])
          return acc
        }
      }
    },
    {} as Record<string, Either<string[], unknown>>
  )
}
