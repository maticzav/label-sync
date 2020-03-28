import { LSCRepository } from '../../src/configuration'
import { GithubLabel } from '../../src/github'
import { calculateDiff } from '../../src/handlers/labels'

describe('labels:', () => {
  test('calculateDiff', () => {
    const config: LSCRepository['labels'] = {
      /* unchanged */
      'label/unchanged': {
        color: 'unchanged',
        alias: ['no/label'],
      },
      /* changed */
      'label/changed': {
        color: 'changed',
      },
      /* new */
      'label/new': {
        color: 'new',
      },
      /* aliased */
      'label/aliased': {
        color: 'aliased',
        alias: ['label/renamed'],
      },
    }
    const labels: GithubLabel[] = [
      {
        name: 'label/unchanged',
        color: 'unchanged',
      },
      {
        name: 'label/changed',
        color: '00',
      },
      {
        name: 'label/removed',
        color: 'removed',
      },
      {
        name: 'label/renamed',
        color: 'renamed',
      },
    ]

    const diff = calculateDiff(config)(labels)

    expect(diff).toEqual({
      added: [
        {
          name: 'label/new',
          color: 'new',
          description: undefined,
        },
      ],
      changed: [
        {
          old_name: 'label/renamed',
          name: 'label/aliased',
          color: 'aliased',
          description: undefined,
        },
        {
          name: 'label/changed',
          color: 'changed',
          description: undefined,
        },
      ],
      removed: [
        {
          name: 'label/removed',
          color: 'removed',
          description: undefined,
        },
      ],
    })
  })
})
