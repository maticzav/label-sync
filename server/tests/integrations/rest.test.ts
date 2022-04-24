import { InstallationsSource } from '@labelsync/database'
import express from 'express'
import { Server } from 'http'
import nock from 'nock'
import pino from 'pino'
import { Probot } from 'probot'
import request from 'request-promise-native'
import Stripe from 'stripe'

import { Sources } from '../../src/lib/sources'

import { subscribe } from '../../src/routes/subscribe.route'

describe('rest:', () => {
  let sources: Sources
  let server: Server

  beforeAll(async () => {
    // Network settings
    nock.disableNetConnect()
    // local servers
    nock.enableNetConnect((host) => {
      return host.includes('localhost') || host.includes('127.0.0.1') || host.includes('stripe')
    })

    // DataStores
    sources = {
      installations: new InstallationsSource(5, 60 * 1000),
      stripe: new Stripe('sk_test_gQB5rH8aGqEhNGuBtgk9yK8L007RgZDRLh', {
        apiVersion: '2020-08-27',
      }),
      log: pino(),
    }

    const exprs = express()
    const subrouter = express.Router()
    subscribe(subrouter, sources)
    exprs.use('/subscribe', subrouter)

    server = exprs.listen(4040)
  })

  afterAll(async () => {
    nock.cleanAll()
    nock.enableNetConnect()

    sources.installations.dispose()
    server.close()
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

    expect(body).toEqual({ status: 'ok', plan: 'FREE' })

    let installation: any = await sources.installations.get({ account: 'maticzav' })

    delete installation['id']
    delete installation['createdAt']
    delete installation['updatedAt']
    delete installation['periodEndsAt']
    delete installation['ttl']

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

    const session = await sources.stripe.checkout.sessions.retrieve(body.session, {
      expand: ['subscription'],
    })

    expect(session.customer_email).toBe('test@label-sync.com')

    /* Test database */

    let installation: any = await sources.installations.get({ account: 'maticzav' })

    delete installation['id']
    delete installation['createdAt']
    delete installation['updatedAt']
    delete installation['periodEndsAt']
    delete installation['ttl']

    expect(installation).toMatchSnapshot()
  })

  /* End of tests */
})
