/**
 * Selects desired fields from an object.
 */
export function select<T extends object, K extends keyof T>(object: T, keys: K[]): Pick<T, K> {
  const result: any = {}
  for (const key of keys) {
    result[key] = object[key]
  }
  return result
}

/**
 * Makes a type check that is only valid when all cases of a switch
 * statement have been convered.
 */
export class ExhaustiveSwitchCheck extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${JSON.stringify(val)}`)
  }
}

/**
 * A function that asynchronously maps an array.
 */
export function amap<T, Y>(xs: T[], fn: (x: T) => Promise<Y>): Promise<Y[]> {
  return Promise.all(xs.map(fn))
}

/**
 * A function that asynchronously maps an array and filters out failed (null) values.
 */
export function famap<T, Y>(xs: T[], fn: (x: T) => Promise<Y | null>): Promise<Y[]> {
  return Promise.all(xs.map(fn)).then((rs) => rs.filter(isNotNull))
}

function isNotNull<T>(x: T | null): x is T {
  return x != null
}
