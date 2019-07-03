import { handleSync, Config } from '../../../src/tools/ci'

import * as fixtures from '../../__fixtures__/github'

describe('ci', () => {
  test('performs successful dryrun', async () => {
    const client = fixtures.githubClient()
    const config: Config = {
      'maticzav/label-sync': {
        labels: {
          basic: '123123',
        },
        strict: false,
      },
    }

    const res = await handleSync(client as any, config, {
      dryRun: true,
      skipSiblingSync: false,
    })

    expect(client.issues.createLabel).toBeCalledTimes(0)
    expect(client.issues.updateLabel).toBeCalledTimes(0)
    expect(client.issues.deleteLabel).toBeCalledTimes(0)
    expect(client.issues.addLabels).toBeCalledTimes(0)
    expect(res).toMatchSnapshot()
  })

  test('perform successful sync', async () => {
    const client = fixtures.githubClient()
    const config: Config = {
      'maticzav/label-sync': {
        labels: {
          basic: '123123',
        },
        strict: false,
      },
      'maticzav/graphql-shield': {
        labels: {
          basic: '234234',
          'kind/bug': {
            color: 'ff0000',
            siblings: ['bug/0-no-reproduction'],
          },
          'bug/0-no-reproduction': {
            color: '00ff00',
            description: 'No reproduction available.',
          },
        },
        strict: false,
      },
    }

    const res = await handleSync(client as any, config, {
      dryRun: false,
      skipSiblingSync: false,
    })

    expect(client.issues.createLabel).toBeCalledTimes(1)
    expect(client.issues.updateLabel).toBeCalledTimes(3)
    expect(client.issues.deleteLabel).toBeCalledTimes(0)
    expect(client.issues.addLabels).toBeCalledTimes(2)
    expect(res).toMatchSnapshot()
  })

  test('perform successful sync and skips siblings', async () => {
    const client = fixtures.githubClient()
    const config: Config = {
      'maticzav/label-sync': {
        labels: {
          basic: '123123',
        },
        strict: false,
      },
      'maticzav/graphql-shield': {
        labels: {
          basic: '234234',
          'kind/bug': {
            color: 'ff0000',
            siblings: ['bug/0-no-reproduction'],
          },
          'bug/0-no-reproduction': {
            color: '00ff00',
            description: 'No reproduction available.',
          },
        },
        strict: false,
      },
    }

    const res = await handleSync(client as any, config, {
      dryRun: false,
      skipSiblingSync: true,
    })

    expect(client.issues.createLabel).toBeCalledTimes(1)
    expect(client.issues.updateLabel).toBeCalledTimes(3)
    expect(client.issues.deleteLabel).toBeCalledTimes(0)
    expect(client.issues.addLabels).toBeCalledTimes(0)
    expect(res).toMatchSnapshot()
  })

  test('correctly reports configuration error', async () => {
    const client = fixtures.githubClient()
    const config: Config = {
      'label-sync': {
        labels: {
          basic: '123123',
          complex: {
            color: '321321',
            siblings: ['doesntexist'],
          },
        },
        strict: true,
      },
    }

    const res = await handleSync(client as any, config, {
      dryRun: true,
      skipSiblingSync: false,
    })

    expect(client.issues.createLabel).toBeCalledTimes(0)
    expect(client.issues.updateLabel).toBeCalledTimes(0)
    expect(client.issues.deleteLabel).toBeCalledTimes(0)
    expect(client.issues.addLabels).toBeCalledTimes(0)
    expect(res).toEqual({
      config: config,
      configErrors: [
        {
          message: 'Cannot decode the provided repository name label-sync',
          repository: 'label-sync',
        },
      ],
      options: { dryRun: true, skipSiblingSync: false },
      syncs: [],
    })
  })

  test('correctly reports repository configuration error', async () => {
    const client = fixtures.githubClient()
    const config: Config = {
      'maticzav/label-sync': {
        labels: {
          basic: '123123',
          complex: {
            color: '321321',
            siblings: ['doesntexist', 'kind/missing'],
          },
        },
        strict: true,
      },
    }

    const res = await handleSync(client as any, config, {
      dryRun: true,
      skipSiblingSync: false,
    })

    expect(client.issues.createLabel).toBeCalledTimes(0)
    expect(client.issues.updateLabel).toBeCalledTimes(0)
    expect(client.issues.deleteLabel).toBeCalledTimes(0)
    expect(client.issues.addLabels).toBeCalledTimes(0)
    expect(res).toEqual({
      config: {
        'maticzav/label-sync': {
          labels: {
            basic: '123123',
            complex: {
              color: '321321',
              siblings: ['doesntexist', 'kind/missing'],
            },
          },
          strict: true,
        },
      },
      configErrors: [],
      options: { dryRun: true, skipSiblingSync: false },
      syncs: [
        {
          config: {
            labels: {
              basic: '123123',
              complex: {
                color: '321321',
                siblings: ['doesntexist', 'kind/missing'],
              },
            },
            strict: true,
          },
          message:
            'Error generating manifest: Labels doesntexist, kind/missing are not defined',
          repository: {
            full_name: 'maticzav/label-sync',
            name: 'label-sync',
            owner: { login: 'maticzav' },
          },
          status: 'error',
        },
      ],
    })
  })
})
