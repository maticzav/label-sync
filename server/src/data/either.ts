/* Either */

interface Left<L> {
  readonly type: 'left'
  value: L
}

interface Right<R> {
  readonly type: 'right'
  value: R
}

export type Either<L, R> = Left<L> | Right<R>

class Internal<L, R> {
  readonly type: Either<L, R>['type']

  constructor(type: Either<L, R>['type']) {
    this.type = type
  }
}

class Left<L> extends Internal<L, any> {
  readonly type: Left<L>['type'] = 'left'
  value: L

  constructor(value: L) {
    super('left')
    this.value = value
  }
}

class Right<R> extends Internal<any, R> {
  readonly type: Right<R>['type'] = 'right'
  value: R

  constructor(value: R) {
    super('right')
    this.value = value
  }
}

/**
 * Constructs an either left.
 * @param value
 */
export function left<L>(value: L): Either<L, any> {
  return new Left(value)
}

export function right<R>(value: R): Either<any, R> {
  return new Right(value)
}

/**
 * Either represents a possible failure.
 * Usually the Left side represents the failure while the right side represents success.
 */
// export class Either<L, R> {
//   private _type: 'left' | 'right'
//   private _data: L | R

//   constructor(type: 'left' | 'right', data: L | R) {
//     this._type = type
//     this._data = data
//   }

//   async either<LR, RR>({
//     left,
//     right,
//   }: {
//     left: (val: L) => LR
//     right: (val: R) => RR
//   }): Promise<LR | RR> {
//     switch (this._type) {
//       case 'left': {
//         return left(this._data as L)
//       }
//       case 'right': {
//         return right(this._data as R)
//       }
//     }
//   }
// }

// export function left<L>(value: L): Either<L, any> {
//   return new Either('left', value)
// }

// export function right<R>(value: R): Either<any, R> {
//   return new Either('right', value)
// }
