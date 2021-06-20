import { Plan, PrismaClient } from '@prisma/client'
import fs from 'fs'
import moment from 'moment'
import nock from 'nock'
import path from 'path'
import { createProbot, Probot } from 'probot'
import { createLogger, format, Logger, transports } from 'winston'

import { logToJSON, removeLogsDateFields } from '../__fixtures__/utils'

import * as manager from '../../src'

// MARK: - Fixtures

import installationPayload from './../__fixtures__/github/installation.created'
import issuesLabeledPayload from './../__fixtures__/github/issues.labeled'
import pullRequestLabeledPayload from './../__fixtures__/github/pr.labeled'
import labelCreatedPayload from './../__fixtures__/github/label.created'
// import marketplacePurchasePayload from './../__fixtures__/github/marketplace_purchase.purchased'
// import marketplaceCancelPayload from './../__fixtures__/github/marketplace_purchase.cancelled'
import prPayload from './../__fixtures__/github/pullrequest.opened'
import pushPayload from './../__fixtures__/github/push'
import repositoryCreatedPayload from './../__fixtures__/github/repository.created'

const configFixture = fs.readFileSync(
  path.resolve(__dirname, './../__fixtures__/labelsync.yml'),
  { encoding: 'utf-8' },
)

const wildcardConfigFixture = fs.readFileSync(
  path.resolve(__dirname, './../__fixtures__/configurations/wildcard.yml'),
  { encoding: 'utf-8' },
)

const newRepoConfigFixture = fs.readFileSync(
  path.resolve(__dirname, './../__fixtures__/configurations/new.yml'),
  { encoding: 'utf-8' },
)

const siblingsConfigFixture = fs.readFileSync(
  path.resolve(__dirname, './../__fixtures__/configurations/siblings.yml'),
  { encoding: 'utf-8' },
)

const LOGS_FILE = path.resolve(__dirname, 'logs', 'github_integration.log')

/* Probot app */

describe('github integration', () => {
  let client: PrismaClient

  beforeAll(async () => {
    // Network settings
    nock.disableNetConnect()
    // local servers
    nock.enableNetConnect((host) => {
      return host.includes('localhost') || host.includes('127.0.0.1')
    })

    // DataStores
    client = new PrismaClient()
  })

  afterAll(async () => {
    nock.cleanAll()
    nock.enableNetConnect()

    await client.$disconnect()
  })

  /**
   * TESTS
   */

  describe(`paid plan`, () => {
    /* Tests on each plan. */
    let winston: Logger
    let probot: Probot

    /* Plan specific setup */
    beforeEach(async () => {
      await client.installation.deleteMany({ where: {} })
      // Create an installation.
      await client.installation.create({
        data: {
          account: 'maticzav',
          email: 'email',
          plan: 'PAID',
          periodEndsAt: moment().add(1, 'h').toDate(),
          activated: true,
        },
      })

      /* Setup probot */
      probot = createProbot({ id: 123, githubToken: 'token', cert: 'test' })
      const app = probot.load((app) => manager(app, client, winston))
    })

    afterEach(() => {
      nock.cleanAll()
    })

    beforeAll(() => {
      /* Reset logs. */
      if (fs.existsSync(LOGS_FILE)) fs.unlinkSync(LOGS_FILE)
      winston = createLogger({
        level: 'debug',
        exitOnError: false,
        format: format.json(),
        transports: [new transports.File({ filename: LOGS_FILE })],
      })
    })

    test.only(
      'push event',
      async () => {
        expect.assertions(13)

        const configEndpoint = jest.fn().mockReturnValue({
          content: Buffer.from(configFixture).toString('base64'),
        })

        const installationsEndpoint = jest.fn().mockReturnValue({
          repositories: [
            { name: 'unchanged' },
            { name: 'CHANGED' },
            { name: 'other' },
          ],
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

        const getIssuesForRepoEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
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

        const createLabelsEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
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
        const updateLabelsEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
            updatedLabels.push({ uri, body })
            return
          })

        let removedLabels: string[] = []
        const removeLabelsEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
            removedLabels.push(uri)
            return
          })

        let aliasedLabels: { uri: string; body: object }[] = []
        const issueLabelsEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
            aliasedLabels.push({ uri, body })
            return
          })

        const commitCommentEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
            expect(body).toMatchSnapshot()
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
          .post(
            '/repos/maticzav/maticzav-labelsync/commits/0000000000000000000000000000000000000000/comments',
          )
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

        const commitCommentEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
            expect(body).toMatchSnapshot()
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
          .post(
            '/repos/maticzav/maticzav-labelsync/commits/0000000000000000000000000000000000000000/comments',
          )
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

        nock('https://api.github.com')
          .post('/app/installations/13055/access_tokens')
          .reply(200, { token: 'test' })

        nock('https://api.github.com')
          .get(
            '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
          )
          .reply(200, configEndpoint)

        nock('https://api.github.com')
          .get('/installation/repositories?per_page=100&page=1')
          .reply(200, installationsEndpoint)

        nock('https://api.github.com')
          .post(
            '/repos/maticzav/maticzav-labelsync/commits/0000000000000000000000000000000000000000/comments',
          )
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
        const compareEndpoint = jest.fn().mockReturnValue({
          files: [{ filename: 'labelsync.yml' }, { filename: 'README.md' }],
        })

        const configEndpoint = jest.fn().mockReturnValue({
          content: Buffer.from(configFixture).toString('base64'),
        })

        const installationsEndpoint = jest.fn().mockReturnValue({
          repositories: [
            { name: 'changed' },
            { name: 'unchanged' },
            { name: 'other' },
          ],
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

        const getIssuesForRepoEndpoint = jest
          .fn()
          .mockImplementation((uri, body) => {
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

        nock('https://api.github.com')
          .post('/app/installations/13055/access_tokens')
          .reply(200, { token: 'test' })

        nock('https://api.github.com')
          .post('/repos/maticzav/maticzav-labelsync/check-runs')
          .reply(200, (uri, body: any) => {
            // body = JSON.parse(body)
            delete body['started_at']
            expect(body).toMatchSnapshot()
            return { id: 123 }
          })

        nock('https://api.github.com')
          .get(
            '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=labels',
          )
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
  })
})
