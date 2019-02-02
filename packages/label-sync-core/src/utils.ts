/**
 *
 * Returns fallback if value is undefined.
 *
 * @param fallback
 */
export function withDefault<T>(fallback: T): (value: T | undefined) => T {
  return value => {
    if (value !== undefined) {
      return value
    } else {
      return fallback
    }
  }
}

/**
 *
 * Flatten array of arrays.
 *
 * @param xss
 */
export function flatten<T>(xss: T[][]): T[] {
  return xss.reduce<T[]>((acc, xs) => [...acc, ...xs], [])
}
