import ml from 'multilines'
import pino from 'pino'
import { OrganizationSyncProcessor } from '../../src/processors/organizationSyncProcessor'
import { MockGitHubEndpoints } from '../__fixtures__/endpoints'
import { MockTaskQueue } from '../__fixtures__/queue'

describe('organization sync', () => {
  test('onboards organization', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
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

    await processor.perform({ owner: 'test-org' })

    expect(endpoints.stack).toMatchSnapshot()
  })
})
