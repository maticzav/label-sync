import fs from 'fs'
import { Probot } from 'probot'
import nock from 'nock'
import path from 'path'
import pino from 'pino'
import Stream from 'stream'
import Stripe from 'stripe'

import { InstallationsSource } from '@labelsync/database'

import { Sources } from '../../src/lib/sources'
import { github } from '../../src/events/github.events'

import { removeLogsDateFields } from '../../../workers/sync/tests/__fixtures__/utils'

/* Fixtures */

import installationPayload from '../../../workers/sync/tests/__fixtures__/github/installation.created'
import issuesLabeledPayload from '../../../workers/sync/tests/__fixtures__/github/issues.labeled'
import pullRequestLabeledPayload from '../../../workers/sync/tests/__fixtures__/github/pr.labeled'
import labelCreatedPayload from '../../../workers/sync/tests/__fixtures__/github/label.created'
import prPayload from '../../../workers/sync/tests/__fixtures__/github/pullrequest.opened'
import pushPayload from '../../../workers/sync/tests/__fixtures__/github/push'
import repositoryCreatedPayload from '../../../workers/sync/tests/__fixtures__/github/repository.created'
import { TaskQueue } from '@labelsync/queues'

const configFixture = fs.readFileSync(path.resolve(__dirname, './../__fixtures__/labelsync.yml'), { encoding: 'utf-8' })

const wildcardConfigFixture = fs.readFileSync(
  path.resolve(__dirname, './../__fixtures__/configurations/wildcard.yml'),
  { encoding: 'utf-8' },
)

const newRepoConfigFixture = fs.readFileSync(path.resolve(__dirname, './../__fixtures__/configurations/new.yml'), {
  encoding: 'utf-8',
})

const siblingsConfigFixture = fs.readFileSync(
  path.resolve(__dirname, './../__fixtures__/configurations/siblings.yml'),
  { encoding: 'utf-8' },
)

describe('github:', () => {
  let sources: Sources
  let probot: Probot
  let logs: object[] = []

  beforeAll(async () => {
    // Network settings
    nock.disableNetConnect()
    // local servers
    nock.enableNetConnect((host) => {
      return host.includes('localhost') || host.includes('127.0.0.1')
    })
  })

  afterAll(async () => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  beforeEach(() => {
    const streamLogsToOutput = new Stream.Writable({ objectMode: true })
    streamLogsToOutput._write = (object, encoding, done) => {
      logs.push(JSON.parse(object))
      done()
    }

    sources = {
      installations: new InstallationsSource(5, 60 * 1000),
      stripe: new Stripe('sk_test_gQB5rH8aGqEhNGuBtgk9yK8L007RgZDRLh', {
        apiVersion: '2020-08-27',
      }),
      tasks: new TaskQueue('redis://localhost:6379'),
      log: pino(streamLogsToOutput),
    }

    probot = new Probot({
      githubToken: 'test',
      log: pino(streamLogsToOutput),
    })

    github(probot, sources)
  })

  afterEach(() => {
    sources.installations.dispose()
    nock.cleanAll()
  })

  // Test for each plan and collect logs.

  const plans: ('FREE' | 'PAID')[] = ['FREE' as const]

  for (const plan of plans) {
    describe(`${plan}`, () => {
      beforeEach(async () => {
        // Create an installation.
        sources.installations.upsert({
          account: 'maticzav',
          email: 'email',
          plan,
          cadence: 'MONTHLY',
          activated: true,
        })
      })

      beforeAll(() => {
        logs = []
      })

      test(
        'installation event bootstrap config',
        async () => {
          expect.assertions(5)

          const repoEndpoint = jest.fn().mockReturnValue({})
          const createRepoEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect(body).toEqual({
              name: 'maticzav-labelsync',
              description: 'LabelSync configuration repository.',
              auto_init: true,
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

          const parentSha = Math.floor(Math.random() * 1000).toString()

          const getRefEndpoint = jest.fn().mockImplementation((uri, body) => {
            return { object: { sha: parentSha } }
          })

          const commitSha = Math.floor(Math.random() * 1000).toString()

          const createCommitEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect(body.parents).toEqual([parentSha])
            return { sha: commitSha }
          })

          const updateRefEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect(body.sha).toBe(commitSha)
            return { object: { sha: '' } }
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com').get('/repos/maticzav/maticzav-labelsync').reply(404, repoEndpoint)

          nock('https://api.github.com').post('/orgs/maticzav/repos').reply(200, createRepoEndpoint)

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/git/blobs')
            .reply(200, createBlobEndpoint)
            .persist()

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/git/trees')
            .reply(200, createTreeEndpoint)
            .persist()

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/git/ref/heads%2Fmaster')
            .reply(200, getRefEndpoint)

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/git/commits')
            .reply(200, createCommitEndpoint)

          nock('https://api.github.com')
            .patch('/repos/maticzav/maticzav-labelsync/git/refs/heads%2Fmaster')
            .reply(200, updateRefEndpoint)

          await probot.receive({
            id: 'installation.boot',
            name: 'installation',
            payload: installationPayload,
          })

          /* Tests */

          expect(repoEndpoint).toBeCalledTimes(1)
          expect(createRepoEndpoint).toBeCalledTimes(1)

          /* Moved to the other test in Github */
          // expect(blobs).toMatchSnapshot()
          // expect(trees).toMatchSnapshot()
        },
        5 * 60 * 1000,
      )

      test.only(
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
            return
          })

          /* Mocks */

          nock('https://api.github.com')
            .post('/app/installations/13055/access_tokens')
            .reply(200, () => {
              return { token: 'test' }
            })

          nock('https://api.github.com').get('/repos/maticzav/maticzav-labelsync').reply(200, repoEndpoint)

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
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
          expect.assertions(11)

          const repoEndpoint = jest.fn().mockReturnValue({
            default_branch: 'master',
          })

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(configFixture).toString('base64'),
          })

          const installationsEndpoint = jest.fn().mockReturnValue({
            repositories: [{ name: 'changed' }, { name: 'unchanged' }, { name: 'other' }],
          })

          const labelsEndpoint = jest.fn().mockImplementation((uri) => {
            switch (uri) {
              case '/repos/maticzav/changed/labels?per_page=100&page=1': {
                return [
                  // {
                  //   name: 'create/new',
                  //   color: '000000',
                  // },
                  // {
                  //   name: 'alias/new',
                  //   color: '000000',
                  // },
                  {
                    name: 'alias/old:1',
                    color: '000000',
                  },
                  {
                    name: 'alias/old:2',
                    color: '000000',
                  },
                  {
                    name: 'update/color',
                    color: '000000',
                  },
                  {
                    name: 'remove',
                    color: '000000',
                  },
                ]
              }
              case '/repos/maticzav/unchanged/labels?per_page=100&page=1': {
                return [
                  {
                    name: 'label-a',
                    color: '000000',
                  },
                ]
              }
              default: {
                throw new Error(`TESTS: Unknown uri: ${uri}`)
              }
            }
          })

          const getIssuesForRepoEndpoint = jest.fn().mockImplementation((uri, body) => {
            return []
          })

          const createLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect({ body, uri }).toEqual({
              uri: '/repos/maticzav/changed/labels',
              body: {
                color: '000000',
                name: 'create/new',
              },
            })
            return
          })

          let updatedLabels: { uri: string; body: object }[] = []

          const updateLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            updatedLabels.push({ uri, body })
            return
          })

          let removedLabels: string[] = []
          const removeLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            removedLabels.push(uri)
            return
          })

          /* Mocks */

          nock('https://api.github.com')
            .post('/app/installations/13055/access_tokens')
            .reply(200, () => {
              return { token: 'test' }
            })

          nock('https://api.github.com').get('/repos/maticzav/maticzav-labelsync').reply(200, repoEndpoint)

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get('/installation/repositories?per_page=100&page=1')
            .reply(200, installationsEndpoint)

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, labelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/issues\?per_page\=100\&page\=1/)
            .reply(200, getIssuesForRepoEndpoint)
            .persist()

          nock('https://api.github.com')
            .post(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, createLabelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .patch(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, updateLabelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .delete(/\/repos\/maticzav\/\w+\/labels/)
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
          expect(getIssuesForRepoEndpoint).toBeCalledTimes(1)
          expect(createLabelsEndpoint).toBeCalledTimes(1)
          expect(updateLabelsEndpoint).toBeCalledTimes(2)
          expect(removeLabelsEndpoint).toBeCalledTimes(2)
          expect(updatedLabels).toMatchSnapshot()
          expect(removedLabels).toMatchSnapshot()
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
            repositories: [{ name: 'changed' }],
          })

          /* Mocks */

          nock('https://api.github.com')
            .post('/app/installations/13055/access_tokens')
            .reply(200, () => {
              return { token: 'test' }
            })

          nock('https://api.github.com').get('/repos/maticzav/maticzav-labelsync').reply(200, repoEndpoint)

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get('/installation/repositories?per_page=100&page=1')
            .reply(200, installationsEndpoint)

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/issues')
            .reply(200, (uri, body) => {
              expect(body).toMatchSnapshot()
              return
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
          expect.assertions(13)

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(configFixture).toString('base64'),
          })

          const installationsEndpoint = jest.fn().mockReturnValue({
            repositories: [{ name: 'unchanged' }, { name: 'CHANGED' }, { name: 'other' }],
          })

          const labelsEndpoint = jest.fn().mockImplementation((uri) => {
            switch (uri) {
              case '/repos/maticzav/changed/labels?per_page=100&page=1': {
                return [
                  // {
                  //   name: 'create/new',
                  //   color: '000000',
                  // },
                  // {
                  //   name: 'alias/new',
                  //   color: '000000',
                  // },
                  {
                    name: 'alias/old:1',
                    color: '000000',
                  },
                  {
                    name: 'alias/old:2',
                    color: '000000',
                  },
                  {
                    name: 'update/color',
                    color: '000000',
                  },
                  {
                    name: 'remove',
                    color: '000000',
                  },
                ]
              }
              case '/repos/maticzav/unchanged/labels?per_page=100&page=1': {
                return [
                  {
                    name: 'label-a',
                    color: '000000',
                  },
                ]
              }
              default: {
                throw new Error(`TESTS: Unknown uri: ${uri}`)
              }
            }
          })

          const getIssuesForRepoEndpoint = jest.fn().mockImplementation((uri, body) => {
            return [
              {
                number: 1,
                labels: [{ name: 'alias/old:1' }, { name: 'alias/old:2' }],
              },
              {
                number: 3,
                labels: [],
              },
              {
                number: 4,
                labels: [{ name: 'alias/old:2' }],
              },
            ]
          })

          const createLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect({ body, uri }).toEqual({
              uri: '/repos/maticzav/changed/labels',
              body: {
                color: '000000',
                name: 'create/new',
              },
            })
            return
          })

          let updatedLabels: { uri: string; body: object }[] = []
          const updateLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            updatedLabels.push({ uri, body })
            return
          })

          let removedLabels: string[] = []
          const removeLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            removedLabels.push(uri)
            return
          })

          let aliasedLabels: { uri: string; body: object }[] = []
          const issueLabelsEndpoint = jest.fn().mockImplementation((uri, body) => {
            aliasedLabels.push({ uri, body })
            return
          })

          const commitCommentEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect(body).toMatchSnapshot()
            return
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get('/installation/repositories?per_page=100&page=1')
            .reply(200, installationsEndpoint)

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, labelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/issues\?per_page\=100\&page\=1/)
            .reply(200, getIssuesForRepoEndpoint)
            .persist()

          nock('https://api.github.com')
            .post(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, createLabelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .patch(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, updateLabelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .delete(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, removeLabelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .post(/\/repos\/maticzav\/\w+\/issues\/\d+\/labels/)
            .reply(200, issueLabelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/commits/0000000000000000000000000000000000000000/comments')
            .reply(200, commitCommentEndpoint)
            .persist()

          await probot.receive({
            id: 'push',
            name: 'push',
            payload: pushPayload,
          })

          /* Tests */

          expect(configEndpoint).toBeCalledTimes(1)
          expect(installationsEndpoint).toBeCalledTimes(1)
          expect(labelsEndpoint).toBeCalledTimes(2)
          expect(getIssuesForRepoEndpoint).toBeCalledTimes(1)
          expect(createLabelsEndpoint).toBeCalledTimes(1)
          expect(updateLabelsEndpoint).toBeCalledTimes(2)
          expect(removeLabelsEndpoint).toBeCalledTimes(2)
          expect(commitCommentEndpoint).toBeCalledTimes(1)
          expect(updatedLabels).toMatchSnapshot()
          expect(removedLabels).toMatchSnapshot()
          expect(aliasedLabels).toMatchSnapshot()
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

          const commitCommentEndpoint = jest.fn().mockImplementation((uri, body) => {
            expect(body).toMatchSnapshot()
            return
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/commits/0000000000000000000000000000000000000000/comments')
            .reply(200, commitCommentEndpoint)
            .persist()

          await probot.receive({
            id: 'push',
            name: 'push',
            payload: pushPayload,
          })

          /* Tests */

          expect(configEndpoint).toBeCalledTimes(1)
          expect(commitCommentEndpoint).toBeCalledTimes(1)
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
            repositories: [{ name: 'CHANGED' }],
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get('/installation/repositories?per_page=100&page=1')
            .reply(200, installationsEndpoint)

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/commits/0000000000000000000000000000000000000000/comments')
            .reply(200, (uri, body) => {
              expect(body).toMatchSnapshot()
              return
            })
            .persist()

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
          expect.assertions(7)

          const compareEndpoint = jest.fn().mockReturnValue({
            files: [{ filename: 'labelsync.yml' }, { filename: 'README.md' }],
          })

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(configFixture).toString('base64'),
          })

          const installationsEndpoint = jest.fn().mockReturnValue({
            repositories: [{ name: 'changed' }, { name: 'unchanged' }, { name: 'other' }],
          })

          const labelsEndpoint = jest.fn().mockImplementation((uri) => {
            switch (uri) {
              case '/repos/maticzav/changed/labels?per_page=100&page=1': {
                return [
                  // {
                  //   name: 'create/new',
                  //   color: '000000',
                  // },
                  // {
                  //   name: 'alias/new',
                  //   color: '000000',
                  // },
                  {
                    name: 'alias/old:1',
                    color: '000000',
                  },
                  {
                    name: 'alias/old:2',
                    color: '000000',
                  },
                  {
                    name: 'update/color',
                    color: '000000',
                  },
                  {
                    name: 'remove',
                    color: '000000',
                  },
                ]
              }
              case '/repos/maticzav/unchanged/labels?per_page=100&page=1': {
                return [
                  {
                    name: 'label-a',
                    color: '000000',
                  },
                ]
              }
              default: {
                throw new Error(`TESTS: Unknown uri: ${uri}`)
              }
            }
          })

          const getIssuesForRepoEndpoint = jest.fn().mockImplementation((uri, body) => {
            return [
              {
                number: 1,
                labels: [{ name: 'alias/old:1' }, { name: 'alias/old:2' }],
              },
            ]
          })

          /* Mocks */

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/compare/master...labels')
            .reply(200, compareEndpoint)

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/check-runs')
            .reply(200, (uri, body: any) => {
              // body = JSON.parse(body)
              delete body['started_at']
              expect(body).toMatchSnapshot()
              return { id: 123 }
            })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=labels')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get('/installation/repositories?per_page=100&page=1')
            .reply(200, installationsEndpoint)

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, labelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/issues\?per_page\=100\&page\=1/)
            .reply(200, getIssuesForRepoEndpoint)
            .persist()

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/issues/2/comments')
            .reply(200, (uri, body) => {
              expect(body).toMatchSnapshot()
              return
            })

          nock('https://api.github.com')
            .patch('/repos/maticzav/maticzav-labelsync/check-runs/123')
            .reply(200, (uri, body: any) => {
              // body = JSON.parse(body)
              delete body['completed_at']
              expect(body).toMatchSnapshot()
              return { id: 123 }
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
          expect(getIssuesForRepoEndpoint).toBeCalledTimes(1)
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

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

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
          expect.assertions(4)

          const compareEndpoint = jest.fn().mockReturnValue({
            files: [{ filename: 'README.md' }, { filename: 'labelsync.yml' }],
          })

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(configFixture).toString('base64'),
          })

          const installationsEndpoint = jest.fn().mockReturnValue({
            repositories: [{ name: 'changed' }],
          })

          /* Mocks */

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/compare/master...labels')
            .reply(200, compareEndpoint)

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .post('/repos/maticzav/maticzav-labelsync/check-runs')
            .reply(200, (uri, body: any) => {
              // body = JSON.parse(body)
              delete body['started_at']
              expect(body).toMatchSnapshot()
              return { id: 123 }
            })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=labels')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get('/installation/repositories?per_page=100&page=1')
            .reply(200, installationsEndpoint)

          nock('https://api.github.com')
            .patch('/repos/maticzav/maticzav-labelsync/check-runs/123')
            .reply(200, (uri, body: any) => {
              // body = JSON.parse(body)
              delete body['completed_at']
              expect(body).toMatchSnapshot()
              return { id: 123 }
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

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .delete(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, (uri) => {
              expect(uri).toBe('/repos/maticzav/changed/labels/:bug:%20Bugfix')
            })
            .persist()

          await probot.receive({
            id: 'labelcreated',
            name: 'label',
            payload: labelCreatedPayload,
          })

          /* Tests */

          expect(configEndpoint).toBeCalledTimes(1)
        },
        5 * 60 * 1000,
      )

      if (plan === 'PAID')
        test(
          'label.created event removes unsupported labels for wildcard configuration',
          async () => {
            expect.assertions(2)

            const configEndpoint = jest.fn().mockReturnValue({
              content: Buffer.from(wildcardConfigFixture).toString('base64'),
            })

            /* Mocks */

            nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

            nock('https://api.github.com')
              .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
              .reply(200, configEndpoint)

            nock('https://api.github.com')
              .delete(/\/repos\/maticzav\/\w+\/labels/)
              .reply(200, (uri) => {
                expect(uri).toBe('/repos/maticzav/changed/labels/:bug:%20Bugfix')
              })
              .persist()

            await probot.receive({
              id: 'labelcreated-wildcard',
              name: 'label',
              payload: labelCreatedPayload,
            })

            /* Tests */

            expect(configEndpoint).toBeCalledTimes(1)
          },
          5 * 60 * 1000,
        )

      test(
        'issues.labeled adds siblings',
        async () => {
          expect.assertions(2)

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(siblingsConfigFixture).toString('base64'),
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          let addedLabels: string[] = []
          nock('https://api.github.com')
            .post('/repos/maticzav/changed/issues/1/labels')
            .reply(200, (uri, body) => {
              addedLabels.push(...(body as any))
              return
            })
            .persist()

          await probot.receive({
            id: 'issueslabeled',
            name: 'issues',
            payload: issuesLabeledPayload,
          })

          /* Tests */

          expect(configEndpoint).toBeCalledTimes(1)
          expect(addedLabels).toMatchSnapshot()
        },
        5 * 60 * 1000,
      )

      test(
        'pull_request.labeled adds siblings',
        async () => {
          expect.assertions(2)

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(siblingsConfigFixture).toString('base64'),
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          let addedLabels: string[] = []
          nock('https://api.github.com')
            .post('/repos/maticzav/changed/issues/1/labels')
            .reply(200, (uri, body) => {
              addedLabels.push(...(body as any))
              return
            })
            .persist()

          await probot.receive({
            id: 'pullrequestlabled',
            name: 'pull_request',
            payload: pullRequestLabeledPayload,
          })

          /* Tests */

          expect(configEndpoint).toBeCalledTimes(1)
          expect(addedLabels).toMatchSnapshot()
        },
        5 * 60 * 1000,
      )

      test(
        'repository created event',
        async () => {
          expect.assertions(3)

          const configEndpoint = jest.fn().mockReturnValue({
            content: Buffer.from(newRepoConfigFixture).toString('base64'),
          })

          const labelsEndpoint = jest.fn().mockImplementation((uri) => {
            /* Nevermind the actual sync - this only checks that sync occurs. */
            return []
          })

          const crudLabelEndpoint = jest.fn().mockImplementation((uri, body) => {
            return
          })

          /* Mocks */

          nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

          nock('https://api.github.com')
            .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
            .reply(200, configEndpoint)

          nock('https://api.github.com')
            .get(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, labelsEndpoint)
            .persist()

          nock('https://api.github.com')
            .post(/\/repos\/maticzav\/\w+\/labels/)
            .reply(200, crudLabelEndpoint)
            .persist()

          await probot.receive({
            id: 'repository.created',
            name: 'repository',
            payload: repositoryCreatedPayload,
          })

          /* Tests */

          expect(configEndpoint).toBeCalledTimes(1)
          expect(labelsEndpoint).toBeCalledTimes(1)
          expect(crudLabelEndpoint).toBeCalledTimes(4)
        },
        5 * 60 * 1000,
      )

      if (plan === 'PAID')
        test(
          'repository created wildcard event',
          async () => {
            expect.assertions(3)

            const configEndpoint = jest.fn().mockReturnValue({
              content: Buffer.from(wildcardConfigFixture).toString('base64'),
            })

            const labelsEndpoint = jest.fn().mockImplementation((uri) => {
              /* Nevermind the actual sync - this only checks that sync occurs. */
              return []
            })

            const crudLabelEndpoint = jest.fn().mockImplementation((uri, body) => {
              return
            })

            /* Mocks */

            nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

            nock('https://api.github.com')
              .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
              .reply(200, configEndpoint)

            nock('https://api.github.com')
              .get(/\/repos\/maticzav\/\w+\/labels/)
              .reply(200, labelsEndpoint)
              .persist()

            nock('https://api.github.com')
              .post(/\/repos\/maticzav\/\w+\/labels/)
              .reply(200, crudLabelEndpoint)
              .persist()

            await probot.receive({
              id: 'repository.created',
              name: 'repository',
              payload: repositoryCreatedPayload,
            })

            /* Tests */

            expect(configEndpoint).toBeCalledTimes(1)
            expect(labelsEndpoint).toBeCalledTimes(1)
            expect(crudLabelEndpoint).toBeCalledTimes(4)
          },
          5 * 60 * 1000,
        )

      if (plan === 'FREE')
        test(
          'repository created event on free',
          async () => {
            expect.assertions(1)

            const configEndpoint = jest.fn().mockReturnValue({
              content: Buffer.from(wildcardConfigFixture).toString('base64'),
            })

            /* Mocks */

            nock('https://api.github.com').post('/app/installations/13055/access_tokens').reply(200, { token: 'test' })

            nock('https://api.github.com')
              .get('/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster')
              .reply(200, configEndpoint)

            await probot.receive({
              id: 'repository.created',
              name: 'repository',
              payload: repositoryCreatedPayload,
            })

            /* Tests */

            expect(configEndpoint).toBeCalledTimes(1)
          },
          5 * 60 * 1000,
        )

      test('logs are reporting correctly', async () => {
        expect(logs.map(removeLogsDateFields)).toMatchSnapshot()
      })

      /* End of tests */
    })
  }
})
