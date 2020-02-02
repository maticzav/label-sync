import fs from 'fs'
import nock from 'nock'
import path from 'path'
import { Probot } from 'probot'

const ls = require('../src')

/* Fixtures */
const configFixture = fs.readFileSync(
  path.resolve(__dirname, './__fixtures__/labelsync.yml'),
  { encoding: 'utf-8' },
)
import labelCreatedPayload from './__fixtures__/github/label.created'
import installationPayload from './__fixtures__/github/installation.created'
import prPayload from './__fixtures__/github/pullrequest.opened'
import pushPayload from './__fixtures__/github/push'

describe('bot:', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  let probot: Probot

  beforeEach(() => {
    probot = new Probot({ id: 123, githubToken: 'token' })
    const app = probot.load(ls)

    app.app = {
      getSignedJsonWebToken: () => 'jwt',
      getInstallationAccessToken: () => Promise.resolve('token'),
    }
  })

  afterEach(() => {
    nock.cleanAll()
  })

  test(
    'installation event bootstrap config',
    async () => {
      expect.assertions(6)

      const repoEndpoint = jest.fn().mockReturnValue({})
      const createRepoEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body).toEqual({
          name: 'maticzav-labelsync',
          description: 'LabelSync configuration repository.',
        })
        return
      })

      let blobs: { [sha: number]: string } = {}

      const createBlobEndpoint = jest.fn().mockImplementation((uri, body) => {
        const sha = Object.keys(blobs).length
        blobs[sha] = body.content
        return { url: 'url', sha }
      })

      let trees: { [sha: number]: string } = {}

      const createTreeEndpoint = jest.fn().mockImplementation((uri, body) => {
        const sha = Object.keys(trees).length
        trees[sha] = body.tree
        return { sha: sha, url: 'url', tree: body.tree }
      })

      const createRefEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body.ref).toBe('refs/heads/master')
        return
      })

      /* Mocks */

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, { token: 'test' })

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync')
        .reply(404, repoEndpoint)

      nock('https://api.github.com')
        .post('/user/repos')
        .reply(200, createRepoEndpoint)

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/git/blobs')
        .reply(200, createBlobEndpoint)
        .persist()

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/git/trees')
        .reply(200, createTreeEndpoint)
        .persist()

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/git/refs')
        .reply(200, createRefEndpoint)

      await probot.receive({
        id: 'installation.boot',
        name: 'installation',
        payload: installationPayload,
      })

      /* Tests */

      expect(repoEndpoint).toBeCalledTimes(1)
      expect(createRepoEndpoint).toBeCalledTimes(1)

      expect(blobs).toMatchSnapshot()
      expect(trees).toMatchSnapshot()
    },
    5 * 60 * 1000,
  )

  test(
    'installation invalid config issue',
    async () => {
      expect.assertions(3)

      const repoEndpoint = jest.fn().mockReturnValue({
        default_branch: 'master',
      })

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from('invalid: invalid').toString('base64'),
      })

      const issuesEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body).toMatchSnapshot()
      })

      /* Mocks */

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, () => {
          return { token: 'test' }
        })

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync')
        .reply(200, repoEndpoint)

      nock('https://api.github.com')
        .get(
          '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
        )
        .reply(200, configEndpoint)

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/issues')
        .reply(200, issuesEndpoint)
        .persist()

      await probot.receive({
        id: 'installation.invalid',
        name: 'installation',
        payload: installationPayload,
      })

      /* Tests */

      expect(repoEndpoint).toBeCalledTimes(1)
      expect(configEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )
  test(
    'installation event sync',
    async () => {
      expect.assertions(10)

      const repoEndpoint = jest.fn().mockReturnValue({
        default_branch: 'master',
      })

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
                name: 'bug/0-needs-reproduction',
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
              {
                name: 'bug/4-fixed',
                color: '222222',
              },
            ]
          }
          case '/repos/maticzav/emma-cli/labels': {
            return [
              {
                name: 'bug/0-needs-reproduction',
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

      const createLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect({ body, uri }).toEqual({
          uri: '/repos/maticzav/graphql-shield/labels',
          body: {
            color: '00ff22',
            description: 'Indicates that we are working on fixing the issue.',
            name: 'bug/3-fixing',
          },
        })
        return
      })

      const updateLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect({ uri, body }).toEqual({
          uri: '/repos/maticzav/graphql-shield/labels/bug/2-bug-confirmed',
          body: {
            color: 'red',
            name: 'bug/2-bug-confirmed',
          },
        })
        return
      })

      const removeLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(uri).toBe('/repos/maticzav/graphql-shield/labels/bug/4-fixed')
        return
      })

      /* Mocks */

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, () => {
          return { token: 'test' }
        })

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync')
        .reply(200, repoEndpoint)

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
        .persist()

      nock('https://api.github.com')
        .post(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, createLabelsEndpoint)
        .persist()

      nock('https://api.github.com')
        .patch(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, updateLabelsEndpoint)
        .persist()

      nock('https://api.github.com')
        .delete(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, removeLabelsEndpoint)
        .persist()

      await probot.receive({
        id: 'installation.sync',
        name: 'installation',
        payload: installationPayload,
      })

      /* Tests */

      expect(repoEndpoint).toBeCalledTimes(1)
      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
      expect(labelsEndpoint).toBeCalledTimes(2)
      expect(createLabelsEndpoint).toBeCalledTimes(1)
      expect(updateLabelsEndpoint).toBeCalledTimes(1)
      expect(removeLabelsEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test(
    'installation event insufficient permissions',
    async () => {
      expect.assertions(4)

      const repoEndpoint = jest.fn().mockReturnValue({
        default_branch: 'master',
      })

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from(configFixture).toString('base64'),
      })

      const installationsEndpoint = jest.fn().mockReturnValue({
        repositories: [{ name: 'graphql-shield' }],
      })

      /* Mocks */

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, () => {
          return { token: 'test' }
        })

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync')
        .reply(200, repoEndpoint)

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
        .reply(200, (uri, body) => {
          expect(body).toMatchSnapshot()
        })

      await probot.receive({
        id: 'installation.insufficient',
        name: 'installation',
        payload: installationPayload,
      })

      /* Tests */

      expect(repoEndpoint).toBeCalledTimes(1)
      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test(
    'push event',
    async () => {
      expect.assertions(9)

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
                name: 'bug/0-needs-reproduction',
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
              {
                name: 'bug/4-fixed',
                color: '222222',
              },
            ]
          }
          case '/repos/maticzav/emma-cli/labels': {
            return [
              {
                name: 'bug/0-needs-reproduction',
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

      const createLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect({ body, uri }).toEqual({
          uri: '/repos/maticzav/graphql-shield/labels',
          body: {
            color: '00ff22',
            description: 'Indicates that we are working on fixing the issue.',
            name: 'bug/3-fixing',
          },
        })
        return
      })

      const updateLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect({ uri, body }).toEqual({
          uri: '/repos/maticzav/graphql-shield/labels/bug/2-bug-confirmed',
          body: {
            color: 'red',
            name: 'bug/2-bug-confirmed',
          },
        })
        return
      })

      const removeLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(uri).toBe('/repos/maticzav/graphql-shield/labels/bug/4-fixed')
        return
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
        .persist()

      nock('https://api.github.com')
        .post(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, createLabelsEndpoint)
        .persist()

      nock('https://api.github.com')
        .patch(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, updateLabelsEndpoint)
        .persist()

      nock('https://api.github.com')
        .delete(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, removeLabelsEndpoint)
        .persist()

      await probot.receive({ id: 'push', name: 'push', payload: pushPayload })

      /* Tests */

      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
      expect(labelsEndpoint).toBeCalledTimes(2)
      expect(createLabelsEndpoint).toBeCalledTimes(1)
      expect(updateLabelsEndpoint).toBeCalledTimes(1)
      expect(removeLabelsEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test(
    'push event invalid configuration',
    async () => {
      expect.assertions(3)

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from('invalid: invalid').toString('base64'),
      })

      const issuesEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body).toMatchSnapshot()
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
        .post('/repos/maticzav/maticzav-labelsync/issues')
        .reply(200, issuesEndpoint)
        .persist()

      await probot.receive({ id: 'push', name: 'push', payload: pushPayload })

      /* Tests */

      expect(configEndpoint).toBeCalledTimes(1)
      expect(issuesEndpoint).toBeCalledTimes(1)
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
        .reply(200, (uri, body) => {
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

  test(
    'pull_request',
    async () => {
      expect.assertions(4)

      const compareEndpoint = jest.fn().mockReturnValue({
        files: [{ filename: 'labelsync.yml' }, { filename: 'README.md' }],
      })

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
                name: 'bug/0-needs-reproduction',
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
              {
                name: 'bug/4-fixed',
                color: '222222',
              },
            ]
          }
          case '/repos/maticzav/emma-cli/labels': {
            return [
              {
                name: 'bug/0-needs-reproduction',
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
        .get('/repos/maticzav/maticzav-labelsync/compare/master...labels')
        .reply(200, compareEndpoint)

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, { token: 'test' })

      nock('https://api.github.com')
        .get(
          '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=labels',
        )
        .reply(200, configEndpoint)

      nock('https://api.github.com')
        .get('/installation/repositories?per_page=100')
        .reply(200, installationsEndpoint)

      nock('https://api.github.com')
        .get(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, labelsEndpoint)
        .persist()

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/issues/2/comments')
        .reply(200, (uri, body) => {
          expect(body).toMatchSnapshot()
        })

      await probot.receive({
        id: 'pr',
        name: 'pull_request',
        payload: prPayload,
      })

      /* Tests */

      expect(compareEndpoint).toBeCalledTimes(1)
      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test(
    'pull_request with no changes',
    async () => {
      expect.assertions(1)

      const compareEndpoint = jest.fn().mockReturnValue({
        files: [{ filename: 'README.md' }],
      })

      /* Mocks */

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync/compare/master...labels')
        .reply(200, compareEndpoint)

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, { token: 'test' })

      await probot.receive({
        id: 'pr.no_changes',
        name: 'pull_request',
        payload: prPayload,
      })

      /* Tests */

      expect(compareEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test(
    'pull_request with insufficient permissions',
    async () => {
      expect.assertions(3)

      const compareEndpoint = jest.fn().mockReturnValue({
        files: [{ filename: 'README.md' }, { filename: 'labelsync.yml' }],
      })

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from(configFixture).toString('base64'),
      })

      const installationsEndpoint = jest.fn().mockReturnValue({
        repositories: [{ name: 'graphql-shield' }],
      })

      /* Mocks */

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync/compare/master...labels')
        .reply(200, compareEndpoint)

      nock('https://api.github.com')
        .post('/app/installations/13055/access_tokens')
        .reply(200, { token: 'test' })

      nock('https://api.github.com')
        .get(
          '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=labels',
        )
        .reply(200, configEndpoint)

      nock('https://api.github.com')
        .get('/installation/repositories?per_page=100')
        .reply(200, installationsEndpoint)

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/issues/2/comments')
        .reply(200, (uri, body) => {
          expect(body).toMatchSnapshot()
        })

      await probot.receive({
        id: 'pr.insufficient',
        name: 'pull_request',
        payload: prPayload,
      })

      /* Tests */

      expect(configEndpoint).toBeCalledTimes(1)
      expect(installationsEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )

  test(
    'label.created event removes unsupported labels',
    async () => {
      expect.assertions(2)

      const configEndpoint = jest.fn().mockReturnValue({
        content: Buffer.from(configFixture).toString('base64'),
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
        .delete(/\/repos\/maticzav\/.*\/labels/)
        .reply(200, uri => {
          expect(uri).toBe(
            '/repos/maticzav/graphql-shield/labels/:bug:%20Bugfix',
          )
        })
        .persist()

      await probot.receive({
        id: 'labelcreated',
        name: 'label.created',
        payload: labelCreatedPayload,
      })

      /* Tests */

      expect(configEndpoint).toBeCalledTimes(1)
    },
    5 * 60 * 1000,
  )
})
