import { GithubLabel, getRepositoryFromName, GithubIssue } from '../github'
import * as siblings from '../siblings'
import { RepositoryConfig } from '../config'

describe('getRepositorySiblingsManifest', () => {
  test('correctly generates manifest', async () => {
    const labels: GithubLabel[] = [
      {
        name: 'bug/no-reproduction',
        color: '333333',
        description: '',
        default: false,
      },
      {
        name: 'basic',
        color: 'f266f4',
        description: '',
        default: false,
      },
      {
        name: 'kind/bug',
        color: '333333',
        description: '',
        default: false,
      },
    ]

    const github = {
      issues: {
        listLabelsForRepo: jest
          .fn()
          .mockResolvedValue({ status: 200, data: labels }),
      },
    }
    const repository = getRepositoryFromName('maticzav/label-sync')!
    const config: RepositoryConfig = {
      labels: {
        'kind/bug': {
          color: '333333',
          siblings: ['bug/no-reproduction'],
        },
        basic: 'f266f4',
      },
    }

    const res = await siblings.getRepositorySiblingsManifest(
      github as any,
      repository,
      config,
    )

    expect(res).toEqual({
      status: 'ok',
      manifest: {
        basic: {
          label: {
            color: 'f266f4',
            default: false,
            description: '',
            name: 'basic',
          },
          siblings: [],
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
      },
    })
  })

  test('rejects on undeifned labels', async () => {
    /* Mocks */

    const labels: GithubLabel[] = [
      {
        name: 'bug/no-reproduction',
        color: '333333',
        description: '',
        default: false,
      },
    ]

    const github = {
      issues: {
        listLabelsForRepo: jest
          .fn()
          .mockResolvedValue({ status: 200, data: labels }),
      },
    }
    const repository = getRepositoryFromName('maticzav/label-sync')!
    const config: RepositoryConfig = {
      labels: {
        'kind/bug': {
          color: '333333',
          siblings: ['undefined-sibling'],
        },
        'kind/feature': {
          color: '333333',
          siblings: ['another-undefined-sibling'],
        },
      },
    }

    const res = await siblings.getRepositorySiblingsManifest(
      github as any,
      repository,
      config,
    )

    expect(res).toEqual({
      message:
        'Labels undefined-sibling, another-undefined-sibling are not defined',
      status: 'err',
    })
  })
})

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

    const github = {
      issues: {
        addLabels: jest.fn().mockResolvedValue({ status: 200 }),
      },
    }

    const repository = getRepositoryFromName('maticzav/label-sync')!
    const issue: GithubIssue = {
      id: 1,
      title: 'Important issue',
      body: '',
      labels: labels,
      state: 'open',
      number: 10,
    }

    const manifest: siblings.RepositoryManifest = {
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
      github as any,
      repository,
      issue,
      manifest,
    )

    expect(res).toEqual({
      status: 'ok',
      siblings: [
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
      ],
    })
  })

  test('returns error on reject', async () => {
    /* Mocks */

    const labels: GithubLabel[] = [
      {
        name: 'kind/bug',
        color: '333333',
        description: '',
        default: false,
      },
    ]

    const github = {
      issues: {
        addLabels: jest.fn().mockResolvedValue({ status: 400 }),
      },
    }

    const repository = getRepositoryFromName('maticzav/label-sync')!
    const issue: GithubIssue = {
      id: 1,
      title: 'Important issue',
      body: '',
      labels: labels,
      state: 'open',
      number: 10,
    }

    const manifest: siblings.RepositoryManifest = {
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
      github as any,
      repository,
      issue,
      manifest,
    )

    expect(res).toEqual({ status: 'err', message: "Couldn't sync siblings." })
  })
})
