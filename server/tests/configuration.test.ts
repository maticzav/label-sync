import ml from 'multilines'

import { parseConfig } from '../src/configuration'

describe('configuration', () => {
  test('parses valid configuration', () => {
    const config = ml`
    | repos:
    |   prisma-test-utils:
    |     strict: false
    |     labels:
    |       bug/0-needs-reproduction:
    |         color: ff0022
    |       bug/1-has-reproduction:
    |         color: ff0022
    |         description: Indicates that an issue has reproduction
    |       bug/2-bug-confirmed:
    |         color: red
    |       bug/3-fixing:
    |         color: 00ff22
    |         description: Indicates that we are working on fixing the issue.
    `

    expect(parseConfig(config)).toEqual({
      repos: {
        'prisma-test-utils': {
          strict: false,
          labels: {
            'bug/0-needs-reproduction': {
              color: 'ff0022',
            },
            'bug/1-has-reproduction': {
              color: 'ff0022',
              description: 'Indicates that an issue has reproduction',
            },
            'bug/2-bug-confirmed': {
              color: 'red',
            },
            'bug/3-fixing': {
              color: '00ff22',
              description: 'Indicates that we are working on fixing the issue.',
            },
          },
        },
      },
    })
  })

  test('nulls on invalid config', () => {
    const config = ml`
    | prisma-test-utils:
    |   strict: false
    |   labels:
    |     bug/0-needs-reproduction:
    |       color: ff0022
    `

    expect(parseConfig(config)).toBeNull()
  })
})
