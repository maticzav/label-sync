import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import * as ls from '../src'
import { repo, label } from '../src'

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
        one: {
          color: '#111111',
          description: undefined,
          alias: [],
          siblings: [],
        },
        two: {
          color: '#111111',
          description: undefined,
          alias: [],
          siblings: [],
        },
        three: {
          color: '#111111',
          description: undefined,
          alias: [],
          siblings: [],
        },
      },
    })
    expect(extended.getConfiguration()).toEqual({
      config: {},
      labels: {
        one: {
          color: '#222222',
          description: undefined,
          alias: [],
          siblings: [],
        },
        two: {
          color: '#111111',
          description: undefined,
          alias: [],
          siblings: [],
        },
        three: {
          color: '#111111',
          description: undefined,
          alias: [],
          siblings: [],
        },
        four: {
          color: '#222222',
          description: undefined,
          alias: [],
          siblings: [],
        },
      },
    })
  })
})
