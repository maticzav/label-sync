import { prismaBinding } from './repositories/prisma-binding'
import { graphqlYoga } from './repositories/graphql-yoga'
import { Config } from 'label-sync-core'

const config: Config = {
  'prisma/prisma-binding': prismaBinding,
  'prisma/graphql-yoga': graphqlYoga,
}

export default config
