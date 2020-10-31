import { PrismaClient, Plan } from '@prisma/client'
import execa from 'execa'
import nock from 'nock'
import { Probot, createProbot } from 'probot'
import Stripe from 'stripe'
import { createLogger, Logger, format, transports } from 'winston'

const manager = require('../../src')

describe('stripe:', () => {
  let prisma: PrismaClient
  let winston: Logger
  let stripe: Stripe

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
    winston = createLogger({
      level: 'info',
      exitOnError: false,
      format: format.json(),
      transports: [],
    })
    stripe = new Stripe(process.env.STRIPE_API_KEY!, {
      apiVersion: '2020-08-27',
    })

    /* Setup probot */
    probot = createProbot({
      id: 1,
      cert: 'test',
      githubToken: 'test',
      port: 5050,
    })

    probot.load((app) => manager(app, prisma, winston, stripe))
    probot.start()
  })

  afterAll(async () => {
    nock.cleanAll()
    nock.enableNetConnect()

    probot.httpServer!.close()
    await prisma.$disconnect()
  })

  let probot: Probot

  beforeEach(async () => {
    /* Clean the database */
    await prisma.installation.deleteMany({ where: {} })
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

    delete installation['createdAt']
    delete installation['updatedAt']
    delete installation['periodEndsAt']
    expect(installation).toMatchSnapshot()
  })

  /* End of tests */
})
