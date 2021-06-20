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
 * Maps entries in a map.
 * @param m
 * @param fn
 */
export function mapEntries<K, T, V>(
  m: Map<K, T>,
  fn: (v: T, key: K) => V,
): Map<K, V> {
  const map = new Map<K, V>()

  for (const key of m.keys()) {
    map.set(key, fn(m.get(key)!, key))
  }

  return map
}
