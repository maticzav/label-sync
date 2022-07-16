import bodyParser from 'body-parser'
import { Router } from 'express'
import { config } from '../lib/config'

import { Sources } from '../lib/sources'

/**
 * Routes associated with Stripe Webhooks.
 */
export const stripe = (router: Router, sources: Sources) => {
  // Stripe Webhook handler
  router.post('/', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    let event

    try {
      event = sources.stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'] as string,
        config.stripeEndpointSecret,
      )
    } catch (err: any) /* istanbul ingore next */ {
      sources.log.error(err, `Error in stripe webhook deconstruction.`)
      res.status(400).send(`Webhook Error: ${err.message}`)

      return
    }

    /* Logger */

    sources.log.info(event.data, `Stripe WebHook event "${event.type}"`)

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

        const installation = await sources.installations.upgrade({
          account: sub.metadata.account,
          cadence,
        })

        sources.log.info(sub.metadata, `New subscriber ${installation?.account ?? 'NONE'}`)

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
