import {
  GithubLabel,
  getRepositoryFromName,
  GithubIssue,
} from '../../../src/github'
import * as siblings from '../../../src/handlers/siblings/siblings'

import * as fixtures from '../../__fixtures__/github'
import { RepositoryManifest } from '../../../src/manifest'

describe('assignSiblingsToIssue', () => {
  test('correctly assigns siblings to an issue', async () => {
    /* Mocks */

    const labels: GithubLabel[] = [
      {
        name: 'kind/bug',
        color: '333333',
        description: '',
        default: false,
      },
    ]

    const client = fixtures.githubClient()

    const repository = getRepositoryFromName('maticzav/label-sync')!
    const issue: GithubIssue = {
      id: 1,
      title: 'Important issue',
      body: '',
      labels: labels,
      state: 'open',
      number: 10,
    }

    const manifest: RepositoryManifest = {
      'bug/no-reproduction': {
        label: {
          color: 'f266f4',
          default: false,
          description: '',
          name: 'bug/no-reproduction',
        },
        siblings: ['kind/bug', 'good-first-issue'],
      },
      'kind/bug': {
        label: {
          color: '333333',
          default: false,
          description: '',
          name: 'kind/bug',
        },
        siblings: ['bug/no-reproduction'],
      },
      'good-first-issue': {
        label: {
          color: '333333',
          default: false,
          description: '',
          name: 'good-first-issue',
        },
        siblings: [],
      },
    }

    const res = await siblings.assignSiblingsToIssue(
      client as any,
      repository,
      issue,
      manifest,
      { dryRun: false },
    )

    expect(res).toEqual([
      {
        color: 'f266f4',
        default: false,
        description: '',
        name: 'bug/no-reproduction',
      },
      {
        color: '333333',
        default: false,
        description: '',
        name: 'good-first-issue',
      },
    ])
    expect(client.issues.addLabels).toBeCalledTimes(1)
  })

  test('correctly performs dryrun', async () => {
    /* Mocks */

    const labels: GithubLabel[] = [
      {
        name: 'kind/bug',
        color: '333333',
        description: '',
        default: false,
      },
      {
        name: 'kind/old-undefined',
        color: '333333',
        description: '',
        default: false,
      },
    ]

    const client = fixtures.githubClient()

    const repository = getRepositoryFromName('maticzav/label-sync')!
    const issue: GithubIssue = {
      id: 1,
      title: 'Important issue',
      body: '',
      labels: labels,
      state: 'open',
      number: 10,
    }

    const manifest: RepositoryManifest = {
      'bug/no-reproduction': {
        label: {
          color: 'f266f4',
          default: false,
          description: '',
          name: 'bug/no-reproduction',
        },
        siblings: ['kind/bug', 'good-first-issue'],
      },
      'kind/bug': {
        label: {
          color: '333333',
          default: false,
          description: '',
          name: 'kind/bug',
        },
        siblings: ['bug/no-reproduction'],
      },
      'good-first-issue': {
        label: {
          color: '333333',
          default: false,
          description: '',
          name: 'good-first-issue',
        },
        siblings: [],
      },
    }

    const res = await siblings.assignSiblingsToIssue(
      client as any,
      repository,
      issue,
      manifest,
      { dryRun: true },
    )

    expect(res).toEqual([
      {
        color: 'f266f4',
        default: false,
        description: '',
        name: 'bug/no-reproduction',
      },
      {
        color: '333333',
        default: false,
        description: '',
        name: 'good-first-issue',
      },
    ])
    expect(client.issues.addLabels).toBeCalledTimes(0)
  })
})
