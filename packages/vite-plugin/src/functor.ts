import { Json } from '@traversable/json'
import type * as T from '@traversable/registry'
import { fn } from '@traversable/registry'

import type { GroupedTypeScriptPluralKeys } from './utils.js'
import { isRight, right } from './utils.js'

export type F<T> =
  | null | boolean | number | string
  | readonly T[]
  | GroupedTypeScriptPluralKeys<T>

export interface Free extends T.HKT { [-1]: F<this[0]> }

export const Functor: T.Functor<Free> = {
  map(f) {
    return (xs) => {
      switch (true) {
        default: return xs satisfies never
        case Json.isScalar(xs): return xs
        case Json.isArray(xs): return fn.map(xs, f)
        case Json.isObject(xs): {
          return fn.map(
            xs,
            (x) => isRight(x) ? right({ ...x.right, value: f(x.right.value) }) : x
          )
        }
      }
    }
  },
}

export const FunctorIx: T.Functor.Ix<{ depth: number }, Free> = {
  ...Functor,
  mapWithIndex(f) {
    return (xs, { depth }) => {
      switch (true) {
        default: return xs satisfies never
        case Json.isScalar(xs): return xs
        case Json.isArray(xs): return fn.map(xs, (x) => f(x, { depth: depth + 1 }))
        case Json.isObject(xs): {
          return fn.map(
            xs,
            (x) => isRight(x) ? right({ ...x.right, value: f(x.right.value, { depth: depth + 1 }) }) : x
          )
        }
      }
    }
  }
}

export const foldWithIndex = fn.cataIx(FunctorIx)
