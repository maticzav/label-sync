export type Dict<T> = { [key: string]: T }

/**
 * Maps entries in an object.
 * @param m
 * @param fn
 */
export function mapEntries<T, V>(m: Dict<T>, fn: (v: T, key: string) => V): Dict<V> {
  const mapped = Object.keys(m).map((key) => {
    return [key, fn(m[key], key)]
  })
  return Object.fromEntries(mapped)
}

/**
 * Maps keys of an object.
 * @param m
 * @param fn
 */
export function mapKeys<T>(m: Dict<T>, fn: (key: string, v: T) => string): Dict<T> {
  const mapped = Object.keys(m).map((key) => {
    return [fn(key, m[key]), m[key]]
  })
  return Object.fromEntries(mapped)
}
