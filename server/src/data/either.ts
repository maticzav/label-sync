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
