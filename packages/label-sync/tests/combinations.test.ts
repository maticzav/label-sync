import { repo, label } from '../src'

import * as mock from './__fixtures__/mock'

describe('combinations:', () => {
  test('extending repository extends labels', () => {
    const original = repo({
      labels: [
        label({
          name: 'one',
          color: '#111111',
        }),
        label({
          name: 'two',
          color: '#111111',
        }),
        label({
          name: 'three',
          color: '#111111',
        }),
      ],
    })

    const extended = repo({
      labels: [
        ...original,
        label({
          name: 'one',
          color: '#222222',
        }),
        label({
          name: 'four',
          color: '#222222',
        }),
      ],
    })

    expect(original.getConfiguration()).toEqual({
      config: {},
      labels: {
        one: mock.label({ color: '#111111' }),
        two: mock.label({ color: '#111111' }),
        three: mock.label({ color: '#111111' }),
      },
    })

    expect(extended.getConfiguration()).toEqual({
      config: {},
      labels: {
        one: mock.label({ color: '#222222' }),
        two: mock.label({ color: '#111111' }),
        three: mock.label({ color: '#111111' }),
        four: mock.label({ color: '#222222' }),
      },
    })
  })
})
