export type JustURI = typeof JustURI
export const JustURI = Symbol.for('i18next-vite-plugin/Just')

export type NothingURI = typeof NothingURI
export const NothingURI = Symbol.for('i18next-vite-plugin/Nothing')

export type Maybe<T> = Just<T> | Nothing
export interface Just<T> { _tag: JustURI, value: T }
export interface Nothing { _tag: NothingURI }

export const isJust = <T>(x: unknown): x is Just<T> => x !== null && typeof x === 'object' && '_tag' in x && x._tag === JustURI
export const isNothing = (x: unknown): x is Nothing => x !== null && typeof x === 'object' && '_tag' in x && x._tag === NothingURI

export function just<T>(x: T): Maybe<T> { return { _tag: JustURI, value: x } }
export function nothing<T>(): Maybe<T> { return { _tag: NothingURI } }

export type LeftURI = typeof LeftURI
export const LeftURI = Symbol.for('i18next-vite-plugin/Left')

export type RightURI = typeof RightURI
export const RightURI = Symbol.for('i18next-vite-plugin/Right')

export type Either<L, R> = Left<L> | Right<R>
export interface Left<L> { _tag: LeftURI, left: L }
export interface Right<R> { _tag: RightURI, right: R }

export const isLeft = <T>(x: unknown): x is Left<T> => x !== null && typeof x === 'object' && '_tag' in x && x._tag === LeftURI
export const isRight = <T>(x: unknown): x is Right<T> => x !== null && typeof x === 'object' && '_tag' in x && x._tag === RightURI

export function left<L, R>(x: L): Either<L, R> { return { _tag: LeftURI, left: x } }
export function right<R, L>(x: R): Either<L, R> { return { _tag: RightURI, right: x } }

export function either<L, R, T>(onLeft: (x: L) => T, onRight: (x: R) => T): (x: Either<L, R>) => T {
  return (x) => isLeft(x) ? onLeft(x.left) : onRight(x.right)
}
