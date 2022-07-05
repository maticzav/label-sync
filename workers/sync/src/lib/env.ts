type Config = {
  prod: boolean
  ghAppId: string
  ghPrivateKey: string

  redisUrl: string
}

// Environments

const base = {}

const prod = {
  prod: true,
  ghAppId: process.env.GH_APP_ID!,
  ghPrivateKey: process.env.GH_PRIVATE_KEY!,

  redisUrl: process.env.REDIS_URL!,
}

const dev = {
  prod: false,
  ghAppId: '',
  ghPrivateKey: '',

  redisUrl: 'redis://localhost:6379',
}

const enviroment = process.env.NODE_ENV

/**
 * Configuration credentials for the worker instance.
 */
export const config: Config = Object.assign(base, enviroment === 'production' ? prod : dev)
