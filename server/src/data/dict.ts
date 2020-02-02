export type Dict<T> = { [key: string]: T }

/**
 * Maps entries in an object.
 * @param m
 * @param fn
 */
export function mapEntries<T, V>(
  m: Dict<T>,
  fn: (v: T, key: string) => V,
): Dict<V> {
  return Object.fromEntries(
    Object.keys(m).map(key => {
      return [key, fn(m[key], key)]
    }),
  )
}

/**
 * Maps entries in an object.
 * @param m
 * @param fn
 */
export async function mapEntriesAsync<T, V>(
  m: Dict<T>,
  fn: (v: T, key: string) => Promise<V>,
): Promise<Dict<V>> {
  const entries = await Promise.all(
    Object.keys(m).map(key => fn(m[key], key).then(value => [key, value])),
  )

  return Object.fromEntries(entries)
}

/**
 * Maps keys of an object.
 * @param m
 * @param fn
 */
export function mapKeys<T>(
  m: Dict<T>,
  fn: (key: string, v: T) => string,
): Dict<T> {
  return Object.fromEntries(
    Object.keys(m).map(key => {
      return [fn(key, m[key]), m[key]]
    }),
  )
}
