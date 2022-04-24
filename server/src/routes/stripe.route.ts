import bodyParser from 'body-parser'
import { Router } from 'express'

import { Sources } from '../lib/sources'

/**
 * Routes associated with Stripe Webhooks.
 */
export const stripe = (router: Router, sources: Sources) => {
  router.post('/', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    /**
     * Stripe Webhook handler.
     */
    let event

    try {
      event = sources.stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'] as string,
        process.env.STRIPE_ENDPOINT_SECRET!,
      )
    } catch (err: any) /* istanbul ingore next */ {
      sources.log.error(`Error in stripe webhook deconstruction.`, {
        meta: {
          error: err.message,
        },
      })
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    /* Logger */

    sources.log.info(`Stripe event ${event.type}`, {
      meta: {
        payload: JSON.stringify(event.data.object),
      },
    })

    /* Event handlers */

    switch (event.type) {
      /* Customer successfully subscribed to LabelSync */
      case 'checkout.session.completed':
      /* Customer paid an invoice */
      case 'invoice.payment_succeeded': {
        const payload = event.data.object as {
          subscription: string
        }

        const sub = await sources.stripe.subscriptions.retrieve(payload.subscription)

        let cadence = 0
        switch (sub.metadata.period) {
          case 'ANNUALLY':
            cadence = 12
            break

          case 'MONTHLY':
            cadence = 1
            break

          /* istanbul ingore next */
          default:
            throw new Error(`Unknown period ${sub.metadata.period}`)
        }

        const installation = await sources.installations.upgrade({ account: sub.metadata.account, cadence })
        sources.log.info(`New subscriber ${installation?.account ?? 'NONE'}`, {
          account: sub.metadata.account,
        })

        return res.json({ received: true })
      }
      /* istanbul ignore next */
      default: {
        sources.log.warn(`unhandled stripe webhook event: ${event.type}`)
        return res.status(400).end()
      }
    }
    /* End of Stripe Webhook handler */
  })
}
