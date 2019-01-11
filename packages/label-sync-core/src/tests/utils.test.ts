import { withDefault } from '../utils'

describe('utils', () => {
  test('withDefault returns value on value', async () => {
    expect(withDefault('fail')('pass')).toBe('pass')
  })

  test('withDefault returns fallback on undefined', async () => {
    expect(withDefault('pass')(undefined)).toBe('pass')
  })
})
