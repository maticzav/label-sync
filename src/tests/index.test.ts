import * as path from 'path'
import * as labels from '../'

describe('Github function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * getRepositoryFromName
   */

  test('getRepositoryFromName correctly extracts repository', async () => {
    expect(labels.getRepositoryFromName('prisma/github-labels')).toEqual({
      owner: 'prisma',
      repo: 'github-labels',
    })
  })

  test('getRepositoryFromName returns null when malformed name', async () => {
    expect(labels.getRepositoryFromName('prisma')).toBeNull()
  })

  /**
   * getRepositoryLabels
   */

  test('getRepositoryLabels obtains correct repository labels', async () => {
    const octokit = {
      issues: {
        listLabelsForRepo: jest
          .fn()
          .mockResolvedValue({ data: ['pass-1', 'pass-2'] }),
      },
    }

    const repository: labels.GithubRepository = {
      owner: 'prisma',
      repo: 'github-labels',
    }

    const res = await labels.getRepostioryLabels(octokit as any, repository)

    expect(octokit.issues.listLabelsForRepo).toHaveBeenCalledWith({
      owner: repository.owner,
      repo: repository.repo,
    })

    expect(res).toEqual(['pass-1', 'pass-2'])
  })

  /**
   * addLabelsToRepository
   */

  test('addLabelsToRepository create labels', async () => {
    const octokit = {
      issues: {
        createLabel: jest.fn().mockResolvedValue({ data: 'pass' }),
      },
    }

    const repository: labels.GithubRepository = {
      owner: 'prisma',
      repo: 'github-labels',
    }

    const res = await labels.addLabelsToRepository(
      octokit as any,
      [
        {
          name: 'label-name',
          description: '',
          color: 'label-color',
          default: false,
        },
        {
          name: 'label-advanced',
          description: 'label-advanced-description',
          color: 'label-advanced-color',
          default: false,
        },
      ],
      repository,
    )

    expect(octokit.issues.createLabel).toHaveBeenNthCalledWith(1, {
      owner: repository.owner,
      repo: repository.repo,
      name: 'label-name',
      description: '',
      color: 'label-color',
    })
    expect(octokit.issues.createLabel).toHaveBeenNthCalledWith(2, {
      owner: repository.owner,
      repo: repository.repo,
      name: 'label-advanced',
      description: 'label-advanced-description',
      color: 'label-advanced-color',
    })
  })

  /**
   * updateLabelsInRepository
   */

  test('updateLabelsInRepository updates labels', async () => {
    const octokit = {
      issues: {
        updateLabel: jest.fn().mockResolvedValue({ data: 'pass' }),
      },
    }

    const repository: labels.GithubRepository = {
      owner: 'prisma',
      repo: 'github-labels',
    }

    const res = await labels.updateLabelsInRepository(
      octokit as any,
      [
        {
          name: 'label-name',
          description: '',
          color: 'label-color',
          default: false,
        },
        {
          name: 'label-advanced',
          description: 'label-advanced-description',
          color: 'label-advanced-color',
          default: false,
        },
      ],
      repository,
    )

    expect(octokit.issues.updateLabel).toHaveBeenNthCalledWith(1, {
      current_name: 'label-name',
      owner: repository.owner,
      repo: repository.repo,
      name: 'label-name',
      description: '',
      color: 'label-color',
    })
    expect(octokit.issues.updateLabel).toHaveBeenNthCalledWith(2, {
      current_name: 'label-advanced',
      owner: repository.owner,
      repo: repository.repo,
      name: 'label-advanced',
      description: 'label-advanced-description',
      color: 'label-advanced-color',
    })
  })

  /**
   * deleteLabelsFromRepository
   */

  test('deleteLabelsFromRepository deletes labels', async () => {
    const octokit = {
      issues: {
        deleteLabel: jest.fn().mockResolvedValue({ data: 'pass' }),
      },
    }

    const repository: labels.GithubRepository = {
      owner: 'prisma',
      repo: 'github-labels',
    }

    const res = await labels.removeLabelsFromRepository(
      octokit as any,
      [
        {
          name: 'label-name',
          description: '',
          color: 'label-color',
          default: false,
        },
        {
          name: 'label-advanced',
          description: 'label-advanced-description',
          color: 'label-advanced-color',
          default: false,
        },
      ],
      repository,
    )

    expect(octokit.issues.deleteLabel).toHaveBeenNthCalledWith(1, {
      owner: repository.owner,
      repo: repository.repo,
      name: 'label-name',
    })
    expect(octokit.issues.deleteLabel).toHaveBeenNthCalledWith(2, {
      owner: repository.owner,
      repo: repository.repo,
      name: 'label-advanced',
    })
  })

  /**
   * getLabelsDiff
   */
  test('getLabelsDiff generates correct diff', async () => {
    const currentLabels: labels.GithubLabel[] = [
      {
        name: 'unchanged',
        description: 'description-unchanged',
        color: 'color',
        default: true,
      },
      {
        name: 'updated',
        description: 'description-updated',
        color: 'color',
        default: true,
      },
      {
        name: 'removed',
        description: 'description-removed',
        color: 'color',
        default: true,
      },
    ]
    const newLabels: labels.GithubLabel[] = [
      {
        name: 'unchanged',
        description: 'description-unchanged',
        color: 'color',
        default: true,
      },
      {
        name: 'updated',
        description: 'description-updated-pass',
        color: 'color',
        default: true,
      },
      {
        name: 'new',
        description: 'description-new',
        color: 'color',
        default: true,
      },
    ]

    const diff = labels.getLabelsDiff(currentLabels, newLabels)

    expect(diff.add).toEqual([
      {
        name: 'new',
        description: 'description-new',
        color: 'color',
        default: true,
      },
    ])
    expect(diff.update).toEqual([
      {
        name: 'updated',
        description: 'description-updated-pass',
        color: 'color',
        default: true,
      },
    ])
    expect(diff.remove).toEqual([
      {
        name: 'removed',
        description: 'description-removed',
        color: 'color',
        default: true,
      },
    ])
  })
})

describe('Utils function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * withDefault
   */

  test('withDefault returns value on value', async () => {
    expect(labels.withDefault('fail')('pass')).toBe('pass')
  })

  test('withDefault returns fallback on undefined', async () => {
    expect(labels.withDefault('pass')(undefined)).toBe('pass')
  })

  /**
   * isLabel
   */

  test('isLabel evalutes true on equal labels', async () => {
    expect(
      labels.isLabel({
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: false,
      })({
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: false,
      }),
    ).toBe(true)
  })

  test('isLabel evalutes false on different labels', async () => {
    expect(
      labels.isLabel({
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: false,
      })({
        name: 'test-',
        description: 'test-description',
        color: 'test-',
        default: true,
      }),
    ).toBe(false)
  })
})
