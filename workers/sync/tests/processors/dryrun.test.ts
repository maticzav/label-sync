import ml from 'multilines'
import pino from 'pino'

import { MockGitHubEndpoints } from '../__fixtures__/endpoints'

import { DryRunProcessor } from '../../src/processors/prDryRunProcessor'

describe('dry run', () => {
  test('creates a report of a valid configuration', async () => {
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
        |   b:
        |     labels:
        |       'new':
        |         color: '000000'
        `,
      },
      labels: {
        'test-org': {
          a: [
            { name: 'updated', color: '000000' },
            { name: 'removed', color: '000000' },
          ],
          b: [],
        },
      },
      installations: {
        'test-org': ['a', 'b'],
      },
    })

    const logger = pino()

    const processor = new DryRunProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({ owner: 'test-org', pr_number: 1 })

    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.createPRCheckRun({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        pr_number: 1,
        name: 'LabelSync Configuration Check',
      }),
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.checkInstallationAccess({ owner: 'test-org', repos: ['a', 'b'] }),
      MockGitHubEndpoints.getLabels({ owner: 'test-org', repo: 'a' }),
      MockGitHubEndpoints.getLabels({ owner: 'test-org', repo: 'b' }),
      MockGitHubEndpoints.completePRCheckRun({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        check_run: 1,
        conclusion: 'success',
        output: {
          title: 'LabelSync Configuration Check',
        },
      }),
    ])
  })

  test('comments on PR with insufficient permissions', async () => {
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
        |   b:
        |     labels:
        |       'new':
        |         color: '000000'
        `,
      },
      installations: {
        'test-org': ['a'],
      },
    })

    const logger = pino()

    const processor = new DryRunProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({ owner: 'test-org', pr_number: 1 })

    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.createPRCheckRun({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        pr_number: 1,
        name: 'LabelSync Configuration Check',
      }),
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.checkInstallationAccess({ owner: 'test-org', repos: ['a', 'b'] }),
      MockGitHubEndpoints.comment({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        issue: 1,
      }),
      MockGitHubEndpoints.completePRCheckRun({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        check_run: 1,
        conclusion: 'failure',
        output: {
          title: 'LabelSync Configuration Check',
        },
      }),
    ])
  })

  test('comments on PR with invalid configuration', async () => {
    const installation = { id: 1, isPaidPlan: false }
    const endpoints = new MockGitHubEndpoints({
      configs: {
        'test-org': ml`
        | repos:
        |   a:
        |     labels:
        |       'new': {}
        |       'updated':
        |         color: '111111'
        `,
      },
      installations: {
        'test-org': ['a'],
      },
    })

    const logger = pino()

    const processor = new DryRunProcessor(
      installation,
      {
        push: () => {
          fail()
        },
      },
      endpoints,
      logger,
    )
    await processor.perform({ owner: 'test-org', pr_number: 1 })

    expect(endpoints.stack()).toMatchObject([
      MockGitHubEndpoints.createPRCheckRun({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        pr_number: 1,
        name: 'LabelSync Configuration Check',
      }),
      MockGitHubEndpoints.getConfig({ owner: 'test-org' }),
      MockGitHubEndpoints.comment({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        issue: 1,
      }),
      MockGitHubEndpoints.completePRCheckRun({
        owner: 'test-org',
        repo: 'test-org-labelsync',
        check_run: 1,
        conclusion: 'failure',
        output: {
          title: 'LabelSync Configuration Check',
        },
      }),
    ])
  })
})
