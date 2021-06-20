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
          .delete(/\/repos\/maticzav\/\w+\/labels/)
          .reply(200, (uri) => {
            expect(uri).toBe('/repos/maticzav/changed/labels/:bug:%20Bugfix')
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

    test(
      'label.created event removes unsupported labels for wildcard configuration',
      async () => {
        expect.assertions(2)

        const configEndpoint = jest.fn().mockReturnValue({
          content: Buffer.from(wildcardConfigFixture).toString('base64'),
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
          .delete(/\/repos\/maticzav\/\w+\/labels/)
          .reply(200, (uri) => {
            expect(uri).toBe('/repos/maticzav/changed/labels/:bug:%20Bugfix')
          })
          .persist()

        await probot.receive({
          id: 'labelcreated-wildcard',
          name: 'label.created',
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

        nock('https://api.github.com')
          .post('/app/installations/13055/access_tokens')
          .reply(200, { token: 'test' })

        nock('https://api.github.com')
          .get(
            '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
          )
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
          name: 'issues.labeled',
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

        nock('https://api.github.com')
          .post('/app/installations/13055/access_tokens')
          .reply(200, { token: 'test' })

        nock('https://api.github.com')
          .get(
            '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
          )
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
          name: 'pull_request.labeled',
          payload: pullRequestLabeledPayload,
        })

        /* Tests */

        expect(configEndpoint).toBeCalledTimes(1)
        expect(addedLabels).toMatchSnapshot()
      },
      5 * 60 * 1000,
    )
  })
})
