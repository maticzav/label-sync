type Config = {
  prod: boolean
  ghAppId: string
  ghPrivateKey: string

  redisUrl: string
  sentryDSN: string
}

// Environments

const base = {}

const prod = {
  prod: true,
  ghAppId: process.env.GH_APP_ID!,
  ghPrivateKey: process.env.GH_PRIVATE_KEY!,

  redisUrl: process.env.REDIS_URL!,
  sentryDSN: process.env.SENTRY_DSN!,
}

const dev = {
  prod: false,
  ghAppId: '',
  ghPrivateKey: '',

  redisUrl: 'redis://localhost:6379',
  sentryDSN: '',
}

const enviroment = process.env.NODE_ENV

/**
 * Configuration credentials for the worker instance.
 */
export const config: Config = Object.assign(base, enviroment === 'production' ? prod : dev)
