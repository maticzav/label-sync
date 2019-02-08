import { RepositoryConfig } from '../src/config'
import { GithubLabel, getRepositoryFromName, GithubIssue } from '../src/github'
import { getRepositoryManifest } from '../src/manifest'
import * as fixtures from './__fixtures__/github'

describe('getRepositoryManifest', () => {
  test('correctly generates manifest', async () => {
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
})
