import bodyParser from 'body-parser'
import { Router } from 'express'
import { DateTime } from 'luxon'
import Stripe from 'stripe'

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
        const payload = event.data.object as { subscription: string }

        const sub = await sources.stripe.subscriptions.retrieve(payload.subscription)
        if (sub.status !== 'active') {
          sources.log.info(`Subscription ${payload.subscription} is not active.`)
          return
        }

        let customer: Stripe.Customer
        if (typeof sub.customer === 'string') {
          customer = (await sources.stripe.customers.retrieve(sub.customer)) as Stripe.Customer
        } else {
          customer = sub.customer as Stripe.Customer
        }

        const installation = await sources.installations.upgrade({
          account: sub.metadata.account,
          periodEndsAt: DateTime.fromMillis(sub.current_period_end),
          email: customer.email,
        })

        sources.log.info(sub.metadata, `New subscriber ${installation?.account ?? 'NONE'}`)

        return res.json({ received: true })
      }

      default: {
        sources.log.warn(`unhandled stripe webhook event: ${event.type}`)
        res.status(400).end()
        return
      }
    }
    /* End of Stripe Webhook handler */
  })
}
