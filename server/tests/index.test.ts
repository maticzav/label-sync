import fs from 'fs'
import nock from 'nock'
import path from 'path'
import { Probot } from 'probot'

import ls from '../src'

/* Fixtures */
const configFixture = fs.readFileSync(
  path.resolve(__dirname, './__fixtures__/labelsync.yml'),
  { encoding: 'utf-8' },
)
import labelCreatedPayload from './__fixtures__/label.created'
import pushPayload from './__fixtures__/push'

describe('bot:', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  let probot: Probot

  beforeEach(() => {
    probot = new Probot({})
    const app = probot.load(ls)

    app.app = {
      getSignedJsonWebToken: () => 'jwt',
      getInstallationAccessToken: () => Promise.resolve('token'),
    }
  })

  test(
    'push event',
    async () => {
      expect.assertions(2)

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from(configFixture).toString('base64'),
      })

      const installationsEndpoint = jest.fn().mockReturnValue({
        repositories: [
          { name: 'graphql-shield' },
          { name: 'emma-cli' },
          { name: 'nookies' },
        ],
      })

      const labelsEndpoint = jest.fn().mockImplementation(uri => {
        switch (uri) {
          case '/repos/maticzav/graphql-shield/labels': {
            return [
              {
                name: 'bug/0-needs-production',
                color: 'ff0022',
              },
              {
                name: 'bug/1-has-reproduction',
                color: 'ff0022',
                description: 'Indicates that an issue has reproduction',
              },
              {
                name: 'bug/2-bug-confirmed',
                color: 'blue',
              },
            ]
          }
          case '/repos/maticzav/emma-cli/labels': {
            return [
              {
                name: 'bug/0-needs-production',
                color: 'ff0022',
              },
              {
                name: 'bug/1-has-reproduction',
                color: 'ff0022',
                description: 'Indicates that an issue has reproduction',
              },
              {
                name: 'bug/2-bug-confirmed',
                color: 'red',
              },
              {
                name: 'bug/3-fixing',
                color: '00ff22',
                description:
                  'Indicates that we are working on fixing the issue.',
              },
            ]
          }
          default: {
            throw new Error(`Unknown uri: ${uri}`)
          }
        }
      })

      /* Mocks */

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, { token: 'test' })

      nock('https://api.github.com')
        .get(
          '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
        )
        .reply(200, configEndpoint)

      nock('https://api.github.com')
        .get('/installation/repositories?per_page=100')
        .reply(200, installationsEndpoint)

      nock('https://api.github.com')
        .get(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, labelsEndpoint)

      nock('https://api.github.com')
        .post(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, (uri, body) => {
          switch (uri) {
            case '/repos/maticzav/graphql-shield/labels': {
            }
            case '/repos/maticzav/emma-cli/labels': {
            }
          }
        })

      nock('https://api.github.com')
        .delete(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, (uri, body) => {
          switch (uri) {
            case '/repos/maticzav/graphql-shield/labels': {
            }
            case '/repos/maticzav/emma-cli/labels': {
            }
          }
        })

      await probot.receive({ id: 'push', name: 'push', payload: pushPayload })

      /* Tests */

      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
      expect(labelsEndpoint).toBeCalledTimes(2)
    },
    5 * 60 * 1000,
  )

  test(
    'push event with insufficient premissions',
    async () => {
      expect.assertions(3)

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from(configFixture).toString('base64'),
      })

      const installationsEndpoint = jest.fn().mockReturnValue({
        repositories: [{ name: 'graphql-shield' }],
      })

      /* Mocks */

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, { token: 'test' })

      nock('https://api.github.com')
        .get(
          '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
        )
        .reply(200, configEndpoint)

      nock('https://api.github.com')
        .get('/installation/repositories?per_page=100')
        .reply(200, installationsEndpoint)

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/issues')
        .reply(200, body => {
          expect(body).toMatchSnapshot()
        })

      await probot.receive({
        id: 'pushinsufficient',
        name: 'push',
        payload: pushPayload,
      })

      /* Tests */

      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test.skip('label.created event removes unsupported labels', async () => {
    expect.assertions(3)

    const configEndpoint = jest.fn().mockReturnValue({
      content: Buffer.from(configFixture).toString('base64'),
    })

    const installationsEndpoint = jest.fn().mockReturnValue({
      repositories: [{ name: 'graphql-shield' }],
    })

    /* Mocks */

    nock('https://api.github.com')
      .post('/app/installations/13055/access_tokens')
      .reply(200, { token: 'test' })

    nock('https://api.github.com')
      .get(
        '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
      )
      .reply(200, configEndpoint)

    nock('https://api.github.com')
      .delete('/repos/maticzav/maticzav-labelsync/issues')
      .reply(200, (uri, body) => {
        console.log(uri, body)
      })

    await probot.receive({
      id: 'labelcreated',
      name: 'label.created',
      payload: labelCreatedPayload,
    })

    /* Tests */

    expect(configEndpoint).toBeCalledTimes(1)
    expect(installationsEndpoint).toBeCalledTimes(1)
  })
})
