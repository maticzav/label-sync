export type Dict<T> = { [key: string]: T }

/**
 * Maps entries in an object.
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

/**
 * Maps entries in an object.
 * @param m
 * @param fn
 */
export async function mapEntriesAsync<K, T, V>(
  m: Map<K, T>,
  fn: (v: T, key: K) => Promise<V>,
): Promise<Map<K, V>> {
  const map = new Map<K, V>()

  for (const key of m.keys()) {
    map.set(key, await fn(m.get(key)!, key))
  }

  return map
}

/**
 * Maps keys of an object.
 * @param m
 * @param fn
 */
export function mapKeys<K, Y, T>(
  m: Map<K, T>,
  fn: (key: K, v: T) => Y,
): Map<Y, T> {
  const map = new Map<Y, T>()

  for (const key of m.keys()) {
    const value = m.get(key)!
    map.set(fn(key, value), value)
  }

  return map
}
