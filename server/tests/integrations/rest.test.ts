import { PrismaClient, Plan } from '@prisma/client'
import { createLogger, Logger } from 'logdna'
import nock from 'nock'
import { Probot, createProbot } from 'probot'
import request from 'request-promise-native'
import Stripe from 'stripe'

const manager = require('../../src')

describe('rest:', () => {
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
      port: 4040,
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

  test('FREE creates a resource', async () => {
    const body = await request({
      uri: `http://localhost:4040/subscribe/session`,
      method: 'POST',
      json: true,
      body: {
        email: 'test@label-sync.com',
        account: 'maticzav',
        agreed: true,
        plan: 'FREE',
      },
    }).promise()

    const installation = await prisma.installation.findOne({
      where: { account: 'maticzav' },
    })

    expect(body).toEqual({ status: 'ok', plan: 'FREE' })
    delete installation!.id
    delete installation!.createdAt
    delete installation!.updatedAt
    delete installation!.periodEndsAt
    expect(installation).toMatchSnapshot()
  })

  test('PAID creates a checkout session', async () => {
    const body = await request({
      uri: `http://localhost:4040/subscribe/session`,
      method: 'POST',
      json: true,
      body: {
        email: 'test@label-sync.com',
        account: 'maticzav',
        agreed: true,
        plan: 'PAID',
        period: 'ANNUALLY',
      },
    }).promise()

    expect(body.status).toBe('ok')

    /* Test Stripe */

    const session = await stripe.checkout.sessions.retrieve(body.session, {
      expand: ['subscription'],
    })

    expect(session.customer_email).toBe('test@label-sync.com')

    /* Test database */

    const installation = await prisma.installation.findOne({
      where: { account: 'maticzav' },
    })

    delete installation!.id
    delete installation!.createdAt
    delete installation!.updatedAt
    delete installation!.periodEndsAt
    expect(installation).toMatchSnapshot()
  })

  test('logs are reporting correctly', async () => {
    expect(logs.sort()).toMatchSnapshot()
  })

  /* End of tests */
})
