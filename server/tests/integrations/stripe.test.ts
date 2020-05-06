import { PrismaClient, Plan } from '@prisma/client'
import { Timber } from '@timberio/node'
import execa from 'execa'
import nock from 'nock'
import { Probot, createProbot } from 'probot'
import Stripe from 'stripe'

const manager = require('../../src')

describe('stripe:', () => {
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
      port: 5050,
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
    expect(timberLogs).toMatchSnapshot()
  })

  /* End of tests */
})
