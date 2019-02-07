import { withDefault, flatten } from '../utils'

describe('withDefault', () => {
  test('returns value on value', async () => {
    expect(withDefault('fail')('pass')).toBe('pass')
  })

  test('returns fallback on undefined', async () => {
    expect(withDefault('pass')(undefined)).toBe('pass')
  })
})

test('flatten flattens the array', async () => {
  expect(flatten([[1], [2], [3]])).toEqual([1, 2, 3])
})
