import { andThen } from '../../src/data/maybe'

describe('maybe:', () => {
  test('andThen', () => {
    expect(andThen<number, number>(null, (n) => n * 2)).toBeNull()
    expect(andThen(5, (n) => n * 2)).toBe(10)
  })
})
