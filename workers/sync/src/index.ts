import * as Sentry from '@sentry/node'

import { config } from './lib/env'
import { Worker } from './worker'

Sentry.init({
  dsn: config.sentryDSN,
  serverName: 'worker/sync',
  environment: config.prod ? 'production' : 'development',
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
  integrations: [],
})

const worker = new Worker()

worker
  .start()
  .then(() => {
    console.log(`Started watching...  `)
  })
  .catch((err) => {
    console.error(err)
  })

process.on('SIGINT', () => {
  worker.stop()
  process.exit(0)
})
