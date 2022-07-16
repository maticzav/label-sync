export type Dict<T> = { [key: string]: T }
export type Maybe<T> = T | null

/**
 * Creates a fallback default value.
 * @param fallback
 * @param value
 */
export function withDefault<T>(fallback: T, value: T | undefined): T {
  if (value) return value
  else return fallback
}

/**
 * Maps entries of an object.
 * @param m
 * @param fn
 */
export function mapEntries<T, V>(m: Dict<T>, fn: (v: T) => V): Dict<V> {
  return Object.keys(m).reduce<Dict<V>>((acc, key) => {
    return { ...acc, [key]: fn(m[key]) }
  }, {})
}
