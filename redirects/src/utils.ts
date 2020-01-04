import { isUndefined } from 'util'

export type Dict<T> = { [key: string]: T }

export function withDefault<T>(fallback: T, val: T | undefined): T {
  if (isUndefined(val)) return fallback
  return val
}
