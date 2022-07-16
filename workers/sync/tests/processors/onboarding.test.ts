import pino from 'pino'

import { populateTemplate, TEMPLATES } from '../../src/lib/templates'
import { MockGitHubEndpoints } from '../__fixtures__/endpoints'
import { MockTaskQueue } from '../__fixtures__/queue'

import { OnboardingProcessor } from '../../src/processors/onboardingProcessor'

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

    const tree = populateTemplate(TEMPLATES.yaml, {
      repository: 'test-org-labelsync',
      repositories: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    })

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.checkInstallationAccess({ owner: 'test-org', repos: [] }),
      MockGitHubEndpoints.getRepo({ repo: 'test-org-labelsync', owner: 'test-org' }),
      MockGitHubEndpoints.bootstrapConfigRepository({ owner: 'test-org', repo: 'test-org-labelsync', tree }),
    ])
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

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.checkInstallationAccess({ owner: 'test-org', repos: [] }),
      MockGitHubEndpoints.getRepo({ repo: 'test-org-labelsync', owner: 'test-org' }),
    ])
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

    expect(endpoints.stack()).toEqual([
      MockGitHubEndpoints.checkInstallationAccess({ owner: 'test-user', repos: [] }),
      MockGitHubEndpoints.getRepo({ repo: 'test-user-labelsync', owner: 'test-user' }),
    ])
  })
})
