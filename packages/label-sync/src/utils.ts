/**
 *
 * Maps through the values and removes the ones which returned null.
 *
 * @param xs
 * @param fn
 */
export function filterMap<X, Y>(xs: X[], fn: (x: X) => Y | null): Y[] {
  return xs.reduce<Y[]>((acc, x) => {
    const res = fn(x)
    if (res !== null) {
      return [...acc, res]
    } else {
      return acc
    }
  }, [])
}

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
 * Recursively gets a poroperty from the path.
 *
 * @param obj
 * @param path
 */
export function get(obj: any, path: string): any {
  const [head, ...tail] = path.split('.')
  if (obj.hasOwnProperty(head)) {
    if (tail.length === 0) {
      return obj[head]
    } else {
      return get(obj[head], tail.join('.'))
    }
  } else {
    return undefined
  }
}
