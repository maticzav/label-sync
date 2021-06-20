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

        nock('https://api.github.com')
          .post('/app/installations/13055/access_tokens')
          .reply(200, { token: 'test' })

        nock('https://api.github.com')
          .get(
            '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
          )
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

        nock('https://api.github.com')
          .post('/app/installations/13055/access_tokens')
          .reply(200, { token: 'test' })

        nock('https://api.github.com')
          .get(
            '/repos/maticzav/maticzav-labelsync/contents/labelsync.yml?ref=refs%2Fheads%2Fmaster',
          )
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

    /* End of tests */
  })
})
