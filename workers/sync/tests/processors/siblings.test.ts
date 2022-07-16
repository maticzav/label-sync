import ml from 'multilines'
import pino from 'pino'

import { MockGitHubEndpoints } from '../__fixtures__/endpoints'

import { SiblingsProcessor } from '../../src/processors/siblingsProcessor'

describe('siblings', () => {
  test('adds siblings to an issue', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
        |     labels:
        |       'label/regular':
        |         color: '000000'
				|         siblings: ['a', 'b']
        |       'a':
        |         color: '000000'
        |       'b':
        |         color: '000000'
        `,
      },
      installations: {
        'test-org': ['a'],
      },
    })
    const logger = pino()

    const processor = new SiblingsProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({
      owner: 'test-org',
      repo: 'a',
      issue_number: 1,
      label: 'label/regular',
    })

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.addLabelsToIssue({
        owner: 'test-org',
        repo: 'a',
        issue_number: 1,
        labels: [{ name: 'a' }, { name: 'b' }],
      }),
    ])
  })
})
