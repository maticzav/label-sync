import * as github from '../../../src/github'
import {
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
  getLabelsDiff,
} from '../../../src/handlers/labels'

import * as fixtures from '../../__fixtures__/github'

beforeEach(() => {
  jest.clearAllMocks()
})

test('addLabelsToRepository create labels', async () => {
  const client = fixtures.githubClient()

  const repository = github.getRepositoryFromName('maticzav/label-sync')!

  await addLabelsToRepository(
    client as any,
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

  expect(client.issues.createLabel).toHaveBeenNthCalledWith(1, {
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-name',
    description: '',
    color: 'label-color',
  })
  expect(client.issues.createLabel).toHaveBeenNthCalledWith(2, {
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-advanced',
    description: 'label-advanced-description',
    color: 'label-advanced-color',
  })
})

test('updateLabelsInRepository updates labels', async () => {
  const client = fixtures.githubClient()

  const repository = github.getRepositoryFromName('maticzav/label-sync')!

  await updateLabelsInRepository(
    client as any,
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

  expect(client.issues.updateLabel).toHaveBeenNthCalledWith(1, {
    current_name: 'label-name',
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-name',
    description: '',
    color: 'label-color',
  })
  expect(client.issues.updateLabel).toHaveBeenNthCalledWith(2, {
    current_name: 'label-advanced',
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-advanced',
    description: 'label-advanced-description',
    color: 'label-advanced-color',
  })
})

test('deleteLabelsFromRepository deletes labels', async () => {
  const client = fixtures.githubClient()

  const repository = github.getRepositoryFromName('maticzav/label-sync')!

  await removeLabelsFromRepository(
    client as any,
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

  expect(client.issues.deleteLabel).toHaveBeenNthCalledWith(1, {
    owner: repository.owner.login,
    repo: repository.name,
    name: 'label-name',
  })
  expect(client.issues.deleteLabel).toHaveBeenNthCalledWith(2, {
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

  const diff = getLabelsDiff(currentLabels, newLabels)

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
