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
