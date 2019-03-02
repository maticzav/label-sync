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
          siblings: ['bug/no-reproduction', 'kind/sibling'],
        },
        basic: 'f266f4',
        'kind/sibling': '123123',
      },
    }
    const manifest = await getRepositoryManifest(
      client as any,
      repository,
      config,
    )

    if (manifest.status === 'err') {
      fail(manifest.message)
    } else {
      const res = await handleSiblingSync(
        client as any,
        repository,
        manifest.manifest,
        { dryRun: false },
      )

      expect(client.issues.addLabels).toBeCalledTimes(2)
      expect(res).toMatchSnapshot()
    }
  })

  test('correctly performs dryrun', async () => {
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
      fail(manifest.message)
    } else {
      const res = await handleSiblingSync(
        client as any,
        repository,
        manifest.manifest,
        { dryRun: true },
      )

      expect(client.issues.addLabels).toBeCalledTimes(0)
      expect(res).toMatchSnapshot()
    }
  })
})
