/**
 * Like UnionPick, but for Omit
 */
export type UnionOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
