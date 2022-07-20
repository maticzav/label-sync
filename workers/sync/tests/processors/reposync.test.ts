import ml from 'multilines'
import pino from 'pino'

import { MockGitHubEndpoints } from '../__fixtures__/endpoints'

import { RepositorySyncProcessor } from '../../src/processors/repositorySyncProcessor'

describe('repository sync', () => {
  test('adds and updates laabels in a repository', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
        |     labels:
        |       'new':
        |         color: '000000'
        |       'updated':
        |         color: '111111'
        `,
      },
      labels: {
        'test-org': {
          a: [
            { name: 'updated', color: '000000' },
            { name: 'removed', color: '000000' },
          ],
        },
      },
      installations: {
        'test-org': ['a'],
      },
    })

    const logger = pino()

    const processor = new RepositorySyncProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({ owner: 'test-org', repo: 'a', isPro: true })

    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.getLabels({ owner: 'test-org', repo: 'a' }),
      MockGitHubEndpoints.createLabel({ owner: 'test-org', repo: 'a', label: { name: 'new', color: '000000' } }),
      MockGitHubEndpoints.updateLabel({ owner: 'test-org', repo: 'a', label: { name: 'updated', color: '111111' } }),
    ])
  })

  test('removes an unconfigured label in strict repository', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
				|     config:
				|       removeUnconfiguredLabels: true
        |     labels: {}
        |
        `,
      },
      labels: {
        'test-org': {
          a: [{ name: 'unconfigured', color: '000000' }],
        },
      },
    })

    const logger = pino()

    const processor = new RepositorySyncProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({ owner: 'test-org', repo: 'a', isPro: true })

    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.getLabels({ owner: 'test-org', repo: 'a' }),
      MockGitHubEndpoints.removeLabel({
        owner: 'test-org',
        repo: 'a',
        label: { name: 'unconfigured' },
      }),
    ])
  })

  test('aliases old labels into new ones', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
				|     config:
				|       removeUnconfiguredLabels: true
        |     labels:
        |       'grouped':
        |         color: '000000'
				|	        alias: ['grouped/1', 'grouped/2']
        |
        `,
      },
      labels: {
        'test-org': {
          a: [
            { name: 'grouped/1', color: '000000' },
            { name: 'grouped/2', color: '000000' },
          ],
        },
      },
    })

    const logger = pino()

    const processor = new RepositorySyncProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({ owner: 'test-org', repo: 'a', isPro: true })

    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.getLabels({ owner: 'test-org', repo: 'a' }),
      MockGitHubEndpoints.updateLabel({
        owner: 'test-org',
        repo: 'a',
        label: { old_name: 'grouped/1', name: 'grouped', color: '000000' },
      }),
      MockGitHubEndpoints.aliasLabels({
        owner: 'test-org',
        repo: 'a',
        labels: [{ old_name: 'grouped/2', name: 'grouped' }],
      }),
      MockGitHubEndpoints.removeLabel({
        owner: 'test-org',
        repo: 'a',
        label: { name: 'grouped/2' },
      }),
    ])
  })
})
