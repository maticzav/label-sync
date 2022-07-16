import bodyParser from 'body-parser'
import cors from 'cors'
import { Router } from 'express'
import { config } from '../lib/config'

import { Sources } from '../lib/sources'

/**
 * Routes associated with subscribing to the service.
 */
export const subscribe = (router: Router, sources: Sources) => {
  router.use(cors({ origin: config.corsOrigins, preflightContinue: true }))
  router.use(bodyParser.json())

  /**
   * Handles request for subscription.
   */
  router.post('/session', async (req, res) => {
    try {
      let { email, account, plan, agreed, period, coupon } = req.body as {
        [key: string]: string
      }
      account = account.toLowerCase()

      /* istanbul ignore next */
      if ([email, account].some((val) => val.trim() === '')) {
        return res.send({
          status: 'err',
          message: 'Some fields are missing.',
        })
      }

      /* istanbul ignore next */
      if (!['PAID', 'FREE'].includes(plan)) {
        return res.send({
          status: 'err',
          message: `Invalid plan ${plan}.`,
        })
      }

      /* istanbul ignore next */
      if (plan === 'PAID' && !['MONTHLY', 'ANNUALLY'].includes(period)) {
        return res.send({
          status: 'err',
          message: `Invalid period for paid plan ${period}.`,
        })
      }

      /* Terms of Service */
      /* istanbul ignore next */
      if (!agreed) {
        return res.send({
          status: 'err',
          message: 'You must agree with Terms of Service and Privacy Policy.',
        })
      }

      /* Valid coupon */
      /* istanbul ignore next */
      if (coupon !== undefined && (typeof coupon !== 'string' || coupon.trim() === '')) {
        return res.send({
          status: 'err',
          message: 'Invalid coupon provided.',
        })
      }

      sources.installations.upsert({
        account,
        email,
        plan: 'FREE',
        cadence: 'YEARLY',
        activated: false,
      })

      switch (plan) {
        case 'FREE': {
          /* Return a successful request to redirect to installation. */
          return res.send({ status: 'ok', plan: 'FREE' })
        }
        case 'PAID': {
          /* Figure out the plan */
          let plan: string

          switch (period) {
            case 'MONTHLY': {
              plan = config.planIds.monthly
              break
            }
            case 'ANNUALLY': {
              plan = config.planIds.annual
              break
            }
            /* istanbul ignore next */
            default: {
              throw new Error(`Unknown period ${period}.`)
            }
          }

          /* Create checkout session. */
          const session = await sources.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            subscription_data: {
              items: [{ plan }],
              metadata: {
                period,
                account,
              },
              coupon,
            },
            customer_email: email,
            expand: ['subscription'],
            success_url: 'https://label-sync.com/success',
            cancel_url: 'https://label-sync.com',
          })
          return res.send({ status: 'ok', plan: 'PAID', session: session.id })
        }
        /* istanbul ignore next */
        default: {
          throw new Error(`Unknown plan ${plan}.`)
        }
      }
    } catch (err: any) /* istanbul ignore next */ {
      sources.log.error(`Error in subscription flow: ${err.message}`)
      return res.send({ status: 'err', message: err.message })
    }
  })
}
