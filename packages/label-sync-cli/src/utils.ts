/* Either */

/**
 * Either represents a possible failure.
 * Usually the Left side represents the failure while the right side represents success.
 */
export class Either<L, R> {
  private _type: 'left' | 'right'
  private _data: L | R

  constructor(type: 'left' | 'right', data: L | R) {
    this._type = type
    this._data = data
  }

  async either<LR, RR>({
    left,
    right,
  }: {
    left: (val: L) => LR
    right: (val: R) => RR
  }): Promise<LR | RR> {
    switch (this._type) {
      case 'left': {
        return left(this._data as L)
      }
      case 'right': {
        return right(this._data as R)
      }
    }
  }
}

export function left<L>(value: L): Either<L, any> {
  return new Either('left', value)
}

export function right<R>(value: R): Either<any, R> {
  return new Either('right', value)
}

/* Maybe */

/**
 * Array filterMap polyfill
 */
declare global {
  interface Array<T> {
    filterMap<Y>(fn: (val: T) => Maybe<Y>): Array<Y>
  }
}

/**
 * Performs a map on array values, and then filters nothing values out.
 */
Array.prototype.filterMap = function<Y, T>(
  this: T[],
  fn: (val: T) => Maybe<Y>,
): Y[] {
  return this.map(fn).filter(just)
}

/**
 * Maybe type declaration and helper functions.
 */
// declare global {
//   type Nothing = null | undefined
//   type Maybe<T> = T | Nothing
// }

export type Nothing = null | undefined
export type Maybe<T> = T | Nothing

/**
 * Determines whether a maybe has a value.
 * @param value
 */
function just<Z>(value: Maybe<Z>): value is Z {
  return value !== null && typeof value !== 'undefined'
}

/**
 * Determines whether a maybe has no value
 * @param value
 */
function nothing<Z>(value: Maybe<Z>): value is Nothing {
  return value === null || typeof value === 'undefined'
}

/**
 * Returns default value if provided value is nothing.
 * @param fallback
 * @param val
 */
export function maybe<T>(fallback: T, val: Maybe<T>): T {
  if (nothing(val)) return fallback
  else return val
}
