export type Dict<T> = { [key: string]: T }

/**
 * Maps entries in an object.
 * @param m
 * @param fn
 */
export function mapEntries<T, V>(m: Dict<T>, fn: (v: T) => V): Dict<V> {
  return Object.keys(m).reduce<Dict<V>>((acc, key) => {
    return { ...acc, [key]: fn(m[key]) }
  }, {})
}
