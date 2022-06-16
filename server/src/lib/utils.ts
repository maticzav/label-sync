/**
 * Negates the wrapped function.
 * @param fn
 */
export function not<T, L extends Array<T>>(fn: (...args: L) => boolean): (...args: L) => boolean {
  return (...args) => !fn(...args)
}

/**
 * Creates a fallback default value.
 * @param fallback
 * @param value
 */
export function withDefault<T>(fallback: T, value: T | undefined | null): T {
  if (value == null) return fallback
  return value
}
