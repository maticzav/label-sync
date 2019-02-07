import * as github from '../github'
import * as labels from '../labels'

beforeEach(() => {
  jest.clearAllMocks()
})

test('getGithubLabelsFromRepositoryConfig hydrates the labels correctly', async () => {
  expect(
    labels.getGithubLabelsFromRepositoryConfig({
      strict: true,
      labels: {
        'label-name': 'label-color',
        'label-advanced': {
          description: 'label-advanced-description',
          color: 'label-advanced-color',
        },
      },
    }),
  ).toEqual([
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
  ])
})

test('addLabelsToRepository create labels', async () => {
  const octokit = {
    issues: {
      createLabel: jest.fn().mockResolvedValue({ data: 'pass' }),
    },
  }

  const repository = github.getRepositoryFromName('maticzav/label-sync')!

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
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-name',
    description: '',
    color: 'label-color',
  })
  expect(octokit.issues.createLabel).toHaveBeenNthCalledWith(2, {
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-advanced',
    description: 'label-advanced-description',
    color: 'label-advanced-color',
  })
})

test('updateLabelsInRepository updates labels', async () => {
  const octokit = {
    issues: {
      updateLabel: jest.fn().mockResolvedValue({ data: 'pass' }),
    },
  }

  const repository = github.getRepositoryFromName('maticzav/label-sync')!

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
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-name',
    description: '',
    color: 'label-color',
  })
  expect(octokit.issues.updateLabel).toHaveBeenNthCalledWith(2, {
    current_name: 'label-advanced',
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-advanced',
    description: 'label-advanced-description',
    color: 'label-advanced-color',
  })
})

test('deleteLabelsFromRepository deletes labels', async () => {
  const octokit = {
    issues: {
      deleteLabel: jest.fn().mockResolvedValue({ data: 'pass' }),
    },
  }

  const repository = github.getRepositoryFromName('maticzav/label-sync')!

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
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-name',
  })
  expect(octokit.issues.deleteLabel).toHaveBeenNthCalledWith(2, {
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-advanced',
  })
})

test('getLabelsDiff generates correct diff', async () => {
  const currentLabels: github.GithubLabel[] = [
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
  const newLabels: github.GithubLabel[] = [
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

describe('isLabel', () => {
  test('evalutes true on equal labels', async () => {
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

  test('evalutes false on different labels', async () => {
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
  test('ignores unimportant keys', async () => {
    expect(
      labels.isLabel({
        node_id: '2',
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: true,
      })({
        node_id: '3',
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: true,
      }),
    ).toBe(true)
  })
})
