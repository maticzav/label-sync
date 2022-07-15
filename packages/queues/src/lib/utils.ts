/**
 * Distributive Pick - does not collapse unions into a "shared type" only to
 * run Pick on it. Instead, it "picks" from each union item separately.
 *
 * See https://github.com/klimashkin/css-modules-theme/pull/8
 *
 * Example:
 *      Pick<{ type: "pick" } | { type: "omit" }, "type">
 *  produces { type: "pick" | "omit" }
 *
 * UnionPick<{ type: "pick" } | { type: "omit" }, "type">
 *  produces { type: "pick" } | { type: "omit" }
 */
export type UnionPick<T, K extends keyof T> = T extends unknown ? Pick<T, K> : never

/**
 * Like UnionPick, but for Omit
 */
export type UnionOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
