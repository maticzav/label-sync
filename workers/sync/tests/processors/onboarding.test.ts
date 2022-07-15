import pino from 'pino'
import { OnboardingProcessor } from '../../src/processors/onboardingProcessor'
import { MockGitHubEndpoints } from '../__fixtures__/endpoints'
import { MockTaskQueue } from '../__fixtures__/queue'

describe('onboarding', () => {
  test('onboards organization', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {},
      installations: {
        'test-org': ['a', 'b', 'c'],
      },
      repos: {},
    })
    const queue = new MockTaskQueue()
    const logger = pino()

    const processor = new OnboardingProcessor(installation, queue, endpoints, logger)

    await processor.perform({
      accountType: 'Organization',
      owner: 'test-org',
    })

    expect(endpoints.stack).toMatchSnapshot()
  })

  test('skips onboarding when config repo exists', async () => {
    const installation = {
      id: 1,
      isPaidPlan: false,
    }
    const endpoints = new MockGitHubEndpoints({
      configs: {},
      installations: {
        'test-org': ['a', 'b', 'c'],
      },
      repos: {
        'test-org': {
          'test-org-labelsync': {
            id: 12,
            default_branch: 'master',
          },
        },
      },
    })
    const queue = new MockTaskQueue()
    const logger = pino()

    const processor = new OnboardingProcessor(installation, queue, endpoints, logger)

    await processor.perform({
      accountType: 'Organization',
      owner: 'test-org',
    })

    expect(endpoints.stack).toMatchSnapshot()
  })

  test('onboards personal account', async () => {
    const installation = {
      id: 1,
      isPaidPlan: false,
    }
    const endpoints = new MockGitHubEndpoints({
      configs: {},
      installations: {
        'test-user': ['a', 'b', 'c'],
      },
    })
    const queue = new MockTaskQueue()
    const logger = pino()

    const processor = new OnboardingProcessor(installation, queue, endpoints, logger)

    await processor.perform({
      accountType: 'User',
      owner: 'test-user',
    })

    expect(endpoints.stack).toMatchSnapshot()
  })
})
