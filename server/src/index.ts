import dd from 'pino-datadog'
import pinoms from 'pino-multi-stream'
import { Probot, Server, ApplicationFunctionOptions } from 'probot'
import Stripe from 'stripe'

import { InstallationsSource } from '@labelsync/database'
import { Sources } from './lib/sources'
import { stripe } from './routes/stripe.route'
import { subscribe } from './routes/subscribe.route'
import { github } from './events/github.events'

const setup = (app: Probot, { getRouter }: ApplicationFunctionOptions) => {
  /* Start the server */

  const sources: Sources = {
    installations: new InstallationsSource(5, 60 * 1000),
    stripe: new Stripe(process.env.STRIPE_API_KEY!, {
      apiVersion: '2020-08-27',
    }),
    log: app.log,
  }

  /* Routes */

  if (getRouter) {
    const subscribeRouter = getRouter('/subscribe')
    subscribe(subscribeRouter, sources)

    const stripeRouter = getRouter('/stripe')
    stripe(stripeRouter, sources)
  }

  /* Events */

  github(app, sources)

  app.log(`LabelSync manager up and running! 🚀`)
}

async function main() {
  const writeStream = await dd.createWriteStream({
    apiKey: process.env.DATADOG_APIKEY!,
    ddsource: 'server',
    service: 'label-sync',
  })

  const server = new Server({
    Probot: Probot.defaults({
      log: pinoms({
        streams: [{ stream: writeStream }],
      }),
    }),
  })
  await server.load(setup)
  await server.start()
}

// Start

if (require.main === module) {
  main()
}
