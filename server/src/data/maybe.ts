/**
 * Maybe
 */
export type Nothing = null | undefined
export type Maybe<T> = T | Nothing

/**
 * Determines whether a maybe has a value.
 * @param value
 */
export function just<Z>(value: Maybe<Z>): value is Z {
  return value !== null && typeof value !== 'undefined'
}

/**
 * Determines whether a maybe has no value
 * @param value
 */
export function nothing<Z>(value: Maybe<Z>): value is Nothing {
  return value === null || typeof value === 'undefined'
}

/**
 * Returns default value if provided value is nothing.
 * @param fallback
 * @param val
 */
export function maybe<T>(fallback: T, val: Maybe<T>): T {
  if (nothing(val)) return fallback
  else return val
}
