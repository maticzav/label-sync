export type Maybe<A> = A | null

/**
 * Maps a Just into Just and null into null.
 * @param m
 * @param fn
 */
export function andThen<A, B>(m: Maybe<A>, fn: (a: A) => Maybe<B>): Maybe<B> {
  if (m === null) return null
  else return fn(m)
}
