import * as Sentry from '@sentry/node'

import dd from 'pino-datadog'
import pinoms from 'pino-multi-stream'
import { Probot, Server, ApplicationFunctionOptions } from 'probot'
import Stripe from 'stripe'

import { InstallationsSource } from '@labelsync/database'
import { TaskQueue } from '@labelsync/queues'

import { github } from './routes/github.events'
import { config } from './lib/config'
import { Sources } from './lib/sources'
import { stripe } from './routes/stripe.route'
import { subscribe } from './routes/subscribe.route'

/**
 * Utility function that starts the server.
 */
const setup = (app: Probot, { getRouter }: ApplicationFunctionOptions) => {
  const sources: Sources = {
    installations: new InstallationsSource(),
    stripe: new Stripe(config.stripeApiKey, {
      apiVersion: '2020-08-27',
    }),
    tasks: new TaskQueue(config.redisUrl),
    log: app.log,
  }

  Sentry.init({
    dsn: config.sentryDSN,
    environment: config.prod ? 'production' : 'development',
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
    ],
  })

  /* Routes */

  if (!getRouter) {
    throw new Error(`Couldn't start app because it's missing router.`)
  }

  const subscribeRouter = getRouter('/subscribe')
  subscribe(subscribeRouter, sources)

  const stripeRouter = getRouter('/stripe')
  stripe(stripeRouter, sources)

  /* Events */

  github(app, sources)

  // Done

  app.log(`LabelSync manager up and running! 🚀`)
}

// MAIN

/**
 * Main function that creates a log stream and spins up the Probot server.
 */
async function main() {
  const writeStream = await dd.createWriteStream({
    apiKey: config.datadogApiKey,
    ddsource: 'server',
    service: 'label-sync',
  })

  const server = new Server({
    Probot: Probot.defaults({
      appId: config.ghAppId,
      privateKey: config.ghPrivateKey,
      secret: config.ghSecret,
      log: pinoms({ streams: [{ stream: writeStream }] }),
    }),
  })
  await server.load(setup)
  await server.start()
}

// Start

if (require.main === module) {
  main()
}
