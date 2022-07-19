import ml from 'multilines'
import pino from 'pino'

import { MockGitHubEndpoints } from '../__fixtures__/endpoints'

import { UnconfiguredLabelsProcessor } from '../../src/processors/unconfiguredLabelsProcessor'

describe('unconfigured labels', () => {
  test('removes an unconfigured label in strict repository', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
					| repos:
					|   a:
					|     config:
					|       removeUnconfiguredLabels: true
					|     labels:
					|       'label/regular':
					|         color: '000000'
					`,
      },
      installations: {
        'test-org': ['a'],
      },
    })
    const logger = pino()

    const processor = new UnconfiguredLabelsProcessor(
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
      label: 'label/unconfigured',
      isPro: true,
    })

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.removeLabel({
        owner: 'test-org',
        repo: 'a',
        label: { name: 'label/unconfigured' },
      }),
    ])
  })

  test('ignores unconfigured label in non-strict repository', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
        |     labels:
        |       'label/regular':
        |         color: '000000'
        `,
      },
      installations: {
        'test-org': ['a'],
      },
    })
    const logger = pino()

    const processor = new UnconfiguredLabelsProcessor(
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
      label: 'label/unconfigured',
      isPro: true,
    })

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      //
    ])
  })
})
