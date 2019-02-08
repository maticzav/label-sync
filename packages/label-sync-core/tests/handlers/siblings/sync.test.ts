import { handleSiblingSync } from '../../../src/handlers/siblings/sync'
import * as fixtures from '../../__fixtures__/github'
import { getRepositoryFromName, RepositoryConfig } from '../../../src'
import { getRepositoryManifest } from '../../../src/manifest'

describe('siblings sync', () => {
  test('handles sync correctly', async () => {
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
    const manifest = await getRepositoryManifest(
      client as any,
      repository,
      config,
    )

    if (manifest.status === 'err') {
      return fail(manifest.message)
    }

    const res = await handleSiblingSync(
      client as any,
      repository,
      manifest.manifest,
      {},
    )

    expect(res).toEqual({})
  })
})
