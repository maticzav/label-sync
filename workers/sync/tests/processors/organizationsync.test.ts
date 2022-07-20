import ml from 'multilines'
import pino from 'pino'

import { MockGitHubEndpoints } from '../__fixtures__/endpoints'
import { MockTaskQueue } from '../__fixtures__/queue'

import { OrganizationSyncProcessor } from '../../src/processors/organizationSyncProcessor'

describe('organization sync', () => {
  test('syncs a configuration and dispatches subtasks on valid configuration', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
        |     labels:
        |       'label/regular':
        |         color: '000000'
        |   b:
        |     labels:
        |       'label/regular':
        |         color: '000000'
        |
        `,
      },
      installations: {
        'test-org': ['a', 'b', 'c'],
      },
      repos: {},
    })
    const queue = new MockTaskQueue()
    const logger = pino()

    const processor = new OrganizationSyncProcessor(installation, queue, endpoints, logger)
    await processor.perform({ owner: 'test-org', isPro: true })

    const tasks: string[] = []
    await queue.process(async (task) => {
      if (task.kind === 'sync_repo') {
        tasks.push(task.repo)
      }
      return true
    })

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.checkInstallationAccess({ owner: 'test-org', repos: ['a', 'b'] }),
    ])
    expect(tasks).toEqual(['a', 'b', 'c'])
  })

  test('opens an issue about invalid configuration', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
        |     labels:
        |       'label/regular': {}
        `,
      },
      installations: {
        'test-org': ['a', 'b', 'c'],
      },
      repos: {},
    })
    const queue = new MockTaskQueue()
    const logger = pino()

    const processor = new OrganizationSyncProcessor(installation, queue, endpoints, logger)
    await processor.perform({ owner: 'test-org', isPro: true })

    const tasks: string[] = []
    await queue.process(async (task) => {
      if (task.kind === 'sync_repo') {
        tasks.push(task.repo)
      }
      return true
    })

    expect(tasks).toEqual([])
    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.openIssue({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        title: 'Configuration Issue',
      }),
    ])
  })

  test('opens an issue about insufficient permissions', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   d:
        |     labels:
        |       'label/regular':
        |         color: '000000'
        `,
      },
      installations: {
        'test-org': ['a', 'b', 'c'],
      },
      repos: {},
    })
    const queue = new MockTaskQueue()
    const logger = pino()

    const processor = new OrganizationSyncProcessor(installation, queue, endpoints, logger)
    await processor.perform({ owner: 'test-org', isPro: true })

    const tasks: string[] = []
    await queue.process(async (task) => {
      if (task.kind === 'sync_repo') {
        tasks.push(task.repo)
      }
      return true
    })

    expect(tasks).toEqual([])
    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.checkInstallationAccess({
        owner: 'test-org',
        repos: ['d'],
      }),
      MockGitHubEndpoints.openIssue({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        title: 'Insufficient Permissions',
      }),
    ])
  })
})
