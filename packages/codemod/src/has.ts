const Object_hasOwnProperty = globalThis.Object.prototype.hasOwnProperty

const NotFound = Symbol.for('@i18next-selector/codemod::NotFound')

const isComposite = <T>(u: unknown): u is { [x: string]: T } => !!u && typeof u === 'object'

function hasOwn<K extends keyof any>(u: unknown, key: K): u is { [P in K]: unknown }
function hasOwn(u: unknown, key: keyof any): u is { [x: string]: unknown } {
  return !isComposite(u)
    ? typeof u === 'function' && key in u
    : typeof key === 'symbol'
      ? isComposite(u) && key in u
      : Object_hasOwnProperty.call(u, key)
}

export function get(x: unknown, ks: (keyof any)[]) {
  let out = x
  let k: keyof any | undefined
  while ((k = ks.shift()) !== undefined) {
    if (hasOwn(out, k)) void (out = out[k])
    else if (k === '') continue
    else return NotFound
  }
  return out
}

const isKey = (u: unknown) => typeof u === 'symbol' || typeof u === 'number' || typeof u === 'string'

function parsePath(xs: readonly (keyof any)[] | readonly [...(keyof any)[], (u: unknown) => boolean]):
  [path: (keyof any)[], check: (u: any) => u is any]
function parsePath(xs: readonly (keyof any)[] | readonly [...(keyof any)[], (u: unknown) => boolean]) {
  return Array.isArray(xs) && xs.every(isKey)
    ? [xs, () => true]
    : [xs.slice(0, -1), xs[xs.length - 1]]
}

export type has<KS extends readonly (keyof any)[], T = {}> = has.loop<KS, T>

export declare namespace has {
  export type loop<KS extends readonly unknown[], T>
    = KS extends readonly [...infer Todo, infer K extends keyof any]
    ? has.loop<Todo, { [P in K]: T }>
    : T extends infer U extends {} ? U : never
}

export function has<KS extends readonly (keyof any)[]>(...params: [...KS]): (u: unknown) => u is has<KS>
export function has<const KS extends readonly (keyof any)[], T>(...params: [...KS, (u: unknown) => u is T]): (u: unknown) => u is has<KS, T>
// impl.
export function has(
  ...args:
    | [...path: (keyof any)[]]
    | [...path: (keyof any)[], check: (u: any) => u is any]
) {
  return (u: unknown) => {
    const [path, check] = parsePath(args)
    const got = get(u, path)
    return got !== NotFound && check(got)
  }
}