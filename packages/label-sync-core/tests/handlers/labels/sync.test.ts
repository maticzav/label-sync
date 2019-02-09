import { RepositoryConfig } from '../../../src/types'
import * as github from '../../../src/github'
import {
  LabelSyncOptions,
  handleLabelSync,
} from '../../../src/handlers/labels/sync'
import * as fixtures from '../../__fixtures__/github'

test('correctly performs dry run', async () => {
  const client = fixtures.githubClient()
  const repository = github.getRepositoryFromName('maticzav/label-sync')!

  const configuration: RepositoryConfig = {
    labels: {
      test: {
        description: 'Testing sync.',
        color: '123456',
      },
    },
  }

  const options: LabelSyncOptions = {
    dryRun: true,
  }

  const res = await handleLabelSync(
    client as any,
    repository,
    configuration,
    options,
  )

  expect(client.issues.listLabelsForRepo).toHaveBeenCalledTimes(1)
  expect(client.issues.createLabel).toHaveBeenCalledTimes(0)
  expect(client.issues.updateLabel).toHaveBeenCalledTimes(0)
  expect(client.issues.deleteLabel).toHaveBeenCalledTimes(0)
  expect(res).toEqual({
    repository: repository,
    config: configuration,
    options: options,
    additions: [
      {
        color: '123456',
        default: false,
        description: 'Testing sync.',
        name: 'test',
      },
    ],
    updates: [],
    removals: [
      {
        color: '333333',
        default: false,
        description: '',
        name: 'bug/no-reproduction',
      },
      { color: 'f266f4', default: false, description: '', name: 'basic' },
      { color: '333333', default: false, description: '', name: 'kind/bug' },
    ],
  })
})

test('correctly handles sync', async () => {
  const client = fixtures.githubClient()
  const repository = github.getRepositoryFromName('maticzav/label-sync')!
  const configuration: RepositoryConfig = {
    labels: {
      test: {
        description: 'Testing sync.',
        color: '123456',
      },
      'kind/bug': '654321',
    },
  }

  const options: LabelSyncOptions = {
    dryRun: false,
  }

  const res = await handleLabelSync(
    client as any,
    repository,
    configuration,
    options,
  )

  expect(client.issues.listLabelsForRepo).toHaveBeenCalledTimes(1)
  expect(client.issues.createLabel).toHaveBeenCalledTimes(1)
  expect(client.issues.updateLabel).toHaveBeenCalledTimes(1)
  expect(client.issues.deleteLabel).toHaveBeenCalledTimes(0)
  expect(res).toEqual({
    config: configuration,
    repository: repository,
    options: { dryRun: false },
    additions: [
      {
        color: '123456',
        description: 'Testing sync.',
        name: 'test',
        owner: 'maticzav',
        repo: 'label-sync',
      },
    ],
    updates: [
      {
        color: '654321',
        current_name: 'kind/bug',
        description: '',
        name: 'kind/bug',
        owner: 'maticzav',
        repo: 'label-sync',
      },
    ],
    removals: [
      {
        color: '333333',
        default: false,
        description: '',
        name: 'bug/no-reproduction',
      },
      { color: 'f266f4', default: false, description: '', name: 'basic' },
    ],
  })
})

test('correctly handles strict option', async () => {
  const client = fixtures.githubClient()
  const repository = github.getRepositoryFromName('maticzav/label-sync')!
  const configuration: RepositoryConfig = {
    labels: {
      test: {
        description: 'Testing sync.',
        color: '#123456',
      },
    },
    strict: true,
  }

  const options: LabelSyncOptions = {
    dryRun: false,
  }

  const res = await handleLabelSync(
    client as any,
    repository,
    configuration,
    options,
  )

  expect(client.issues.listLabelsForRepo).toHaveBeenCalledTimes(1)
  expect(client.issues.createLabel).toHaveBeenCalledTimes(1)
  expect(client.issues.updateLabel).toHaveBeenCalledTimes(0)
  expect(client.issues.deleteLabel).toHaveBeenCalledTimes(3)
  expect(res).toEqual({
    config: configuration,
    options: { dryRun: false },
    repository: repository,
    additions: [
      {
        color: '#123456',
        description: 'Testing sync.',
        name: 'test',
        owner: 'maticzav',
        repo: 'label-sync',
      },
    ],
    updates: [],
    removals: [
      {
        color: '333333',
        default: false,
        description: '',
        name: 'bug/no-reproduction',
      },
      { color: 'f266f4', default: false, description: '', name: 'basic' },
      { color: '333333', default: false, description: '', name: 'kind/bug' },
    ],
  })
})
