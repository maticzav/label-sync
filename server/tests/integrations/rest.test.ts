import { PrismaClient, Plan } from '@prisma/client'
import { Timber } from '@timberio/node'
import nock from 'nock'
import { Probot, createProbot } from 'probot'
import request from 'request-promise-native'
import Stripe from 'stripe'

const manager = require('../../src')

describe('rest:', () => {
  let prisma: PrismaClient
  let timber: Timber
  let stripe: Stripe

  let timberLogs: string[] = []

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
    timber = new Timber('apikey', 'source', {
      ignoreExceptions: false,
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

    probot.load((app) => manager(app, prisma, timber, stripe))
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

    /* Mock all timber logs */
    nock('https://logs.timber.io')
      .post(/.*/)
      .reply(200, (uri, body) => {
        /* remove timestamp from log */
        const [log] = body as any
        delete log['dt']
        delete log['periodEndsAt']
        /* collect logs */
        timberLogs.push(JSON.stringify(log))
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

    delete installation!.createdAt
    delete installation!.updatedAt
    delete installation!.periodEndsAt
    expect(installation).toMatchSnapshot()
  })

  test('logs are reporting correctly', async () => {
    expect(timberLogs).toMatchSnapshot()
  })

  /* End of tests */
})
