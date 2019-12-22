import { LSCRepository } from '../../src/configuration'
import { GithubLabel } from '../../src/github'
import { calculateDiff } from '../../src/handlers/labels'

describe('labels:', () => {
  test('calculateDiff', () => {
    const config: LSCRepository['labels'] = {
      /* unchanged */
      'bug/0': {
        color: 'ff',
      },
      /* changed */
      'bug/1': {
        color: '00',
      },
      /* new */
      'bug/2': {
        color: '33',
      },
      /* removed */
      // "bug/3": {
      //   color: "12"
      // }
    }
    const labels: GithubLabel[] = [
      {
        name: 'bug/0',
        color: 'ff',
        default: false,
      },
      {
        name: 'bug/1',
        color: 'ff',
        default: false,
      },
      {
        name: 'bug/3',
        color: 'ff',
        default: false,
      },
    ]

    expect(calculateDiff(config)(labels)).toEqual({
      added: [
        {
          name: 'bug/2',
          color: '33',
          default: false,
        },
      ],
      changed: [
        {
          name: 'bug/1',
          color: '00',
          default: false,
        },
      ],
      removed: [
        {
          name: 'bug/3',
          color: 'ff',
          default: false,
        },
      ],
      unchanged: [
        {
          name: 'bug/0',
          color: 'ff',
          default: false,
        },
      ],
    })
  })
})
