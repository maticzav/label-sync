import { PrismaClient, Plan } from '@prisma/client'
import { createLogger, Logger } from 'logdna'
import execa from 'execa'
import nock from 'nock'
import { Probot, createProbot } from 'probot'
import Stripe from 'stripe'

const manager = require('../../src')

describe('stripe:', () => {
  let prisma: PrismaClient
  let logdna: Logger
  let stripe: Stripe

  let logs: string[] = []

  beforeAll(async () => {
    // Network settings
    nock.disableNetConnect()
    // local servers
    nock.enableNetConnect((host) => {
      return (
        host.includes('localhost') ||
        host.includes('127.0.0.1') ||
        host.includes('stripe')
      )
    })

    // DataStores
    prisma = new PrismaClient()
    logdna = createLogger('apikey', {
      timeout: 1000,
      env: 'TEST',
    })
    stripe = new Stripe(process.env.STRIPE_API_KEY!, {
      apiVersion: '2020-03-02',
    })

    /* Setup probot */
    probot = createProbot({
      id: 1,
      cert: 'test',
      githubToken: 'test',
      port: 5050,
    })

    probot.load((app) => manager(app, prisma, logdna, stripe))
    probot.start()
  })

  afterAll(async () => {
    nock.cleanAll()
    nock.enableNetConnect()

    probot.httpServer!.close()
    await prisma.disconnect()
  })

  let probot: Probot

  beforeEach(async () => {
    /* Clean the database */
    await prisma.installation.deleteMany({ where: {} })

    /* Mock all logs */
    nock('https://logs.logdna.com/')
      .post(/.*/)
      .reply(200, (uri: string, body: any) => {
        /* remove timestamp from log */
        const newLogs: string[] = body[body['e'] as string].map((log: any) => {
          delete log['timestamp']
          if (typeof log['meta'] === 'string') {
            log.meta = JSON.parse(log.meta)
          }
          if (log['meta']) {
            log.meta['periodEndsAt'] = 'periodEndsAt'
          }
          return JSON.stringify(log)
        })

        /* collect logs */
        logs.push(...newLogs)
        return
      })
      .persist()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  /* Tests */

  test.skip('checkout.session.completed', async () => {
    execa('stripe', ['listen', '--forward-to localhost:5050/stripe'], {
      stdio: 'inherit',
      detached: true,
      cleanup: true,
    })
    await execa('stripe', ['trigger', 'checkout.session.completed'])

    /* Test database */

    const installation = await prisma.installation.findOne({
      where: { account: 'maticzav' },
    })

    delete installation!.createdAt
    delete installation!.updatedAt
    delete installation!.periodEndsAt
    expect(installation).toMatchSnapshot()
  })

  test.skip('logs are reporting correctly', async () => {
    expect(logs.sort()).toMatchSnapshot()
  })

  /* End of tests */
})
