type Config = {
  prod: boolean

  corsOrigins: string[]

  // https://probot.github.io/docs/configuration/
  ghAppId: string
  ghPrivateKey: string
  ghSecret: string

  stripeApiKey: string
  stripeEndpointSecret: string

  databaseUrl: string
  redisUrl: string

  sentryDSN: string
  datadogApiKey: string
}

// Environments

const base = {}

const prod = {
  prod: true,

  corsOrigins: [
    'https://label-sync.com',
    'https://www.label-sync.com',
    'https://webhook.label-sync.com',
  ],

  ghAppId: process.env.GH_APP_ID!,
  ghPrivateKey: process.env.GH_PRIVATE_KEY!,
  ghSecret: process.env.GH_SECRET!,

  stripeApiKey: process.env.STRIPE_API_KEY!,
  stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET!,

  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,

  sentryDSN: process.env.SENTRY_DSN!,
  datadogApiKey: process.env.DATADOG_API_KEY!,
}

const dev = {
  prod: false,

  corsOrigins: ['http://localhost', 'http://127.0.0.1'],

  ghAppId: '',
  ghPrivateKey: '',
  ghSecret: '',

  stripeApiKey: '',
  stripeEndpointSecret: '',

  databaseUrl: 'postgres://prisma:prisma@localhost:5432/prisma',
  redisUrl: 'redis://localhost:6379',

  sentryDSN: '',
  datadogApiKey: '',
}

const enviroment = process.env.NODE_ENV

/**
 * Configuration credentials for the worker instance.
 */
export const config: Config = Object.assign(base, enviroment === 'production' ? prod : dev)
