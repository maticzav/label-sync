import { amap, famap, select } from '../../src/lib/utils'

describe('utils', () => {
  test('select', () => {
    const object = {
      a: 1,
      b: 2,
      c: 3,
      d: 'foo',
    }

    const trimmed = select(object, ['a', 'd'])

    expect(trimmed).toEqual({ a: 1, d: 'foo' })
  })

  test('amap', async () => {
    const xs = [1, 2, 3]
    const fn = async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, x * 100))
      return x * 2
    }
    const rs = await amap(xs, fn)

    expect(rs).toEqual([2, 4, 6])
  })

  test('famap', async () => {
    const xs = [null, 1, 2, 3, null]
    const fn = async (x: number | null) => {
      if (x == null) {
        return null
      }

      await new Promise((resolve) => setTimeout(resolve, x * 100))

      return x * 2
    }
    const rs = await famap(xs, fn)

    expect(rs).toEqual([2, 4, 6])
  })
})
