import { RepositoryConfig } from '../src/types'
import { GithubLabel, getRepositoryFromName } from '../src/github'
import {
  getRepositoryManifest,
  getLabelsInConfiguration,
  getSiblingsInConfiguration,
} from '../src/manifest'
import * as fixtures from './__fixtures__/github'

describe('getRepositoryManifest', () => {
  test('correctly generates non-strict manifest', async () => {
    const client = fixtures.githubClient()
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

    const res = await getRepositoryManifest(client as any, repository, config)

    expect(res).toEqual({
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
        'bug/no-reproduction': {
          label: {
            color: '333333',
            default: false,
            description: '',
            name: 'bug/no-reproduction',
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
      status: 'ok',
    })
  })

  test('correctly generates strict manifest', async () => {
    const client = fixtures.githubClient()
    const repository = getRepositoryFromName('maticzav/label-sync')!
    const config: RepositoryConfig = {
      labels: {
        'kind/bug': {
          color: '333333',
          siblings: ['basic'],
        },
        basic: 'f266f4',
      },
      strict: true,
    }

    const res = await getRepositoryManifest(client as any, repository, config)

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
          siblings: ['basic'],
        },
      },
    })
  })

  test('rejects on undeifned labels in non-strict config', async () => {
    /* Mocks */

    const labels: GithubLabel[] = [
      {
        name: 'bug/no-reproduction',
        color: '333333',
        description: '',
        default: false,
      },
    ]
    const client = fixtures.githubClient({
      labels: labels,
    })
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

    const res = await getRepositoryManifest(client as any, repository, config)

    expect(res).toEqual({
      message:
        'Labels undefined-sibling, another-undefined-sibling are not defined',
      status: 'err',
    })
  })

  test('correctly generates strict manifest', async () => {
    const client = fixtures.githubClient()
    const repository = getRepositoryFromName('maticzav/label-sync')!
    const config: RepositoryConfig = {
      labels: {
        'kind/bug': {
          color: '333333',
          siblings: ['bug/no-reproduction'],
        },
        basic: 'f266f4',
      },
      strict: true,
    }

    const res = await getRepositoryManifest(client as any, repository, config)

    expect(res).toEqual({
      status: 'err',
      message: 'Labels bug/no-reproduction are not defined',
    })
  })
})

test('getLabelsInConfiguration finds right labels', async () => {
  expect(
    getLabelsInConfiguration({
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

test('getSiblingsInConfiguration finds right labels', async () => {
  expect(
    getSiblingsInConfiguration({
      strict: true,
      labels: {
        'label-name': 'label-color',
        'label-advanced': {
          description: 'label-advanced-description',
          color: 'label-advanced-color',
          siblings: ['abc'],
        },
        'label-advanced/2': {
          description: 'label-advanced-description',
          color: 'label-advanced-color',
          siblings: ['abc', 'def'],
        },
      },
    }),
  ).toEqual(['abc', 'def'])
})
