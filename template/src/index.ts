import { configuration, make } from 'label-sync'

import { github } from './repositories/github'
import { prisma } from './repositories/prisma'

/**
 * Create a configuration instance by definining repositories
 * and their configurations.
 */
const config = configuration({
  repositories: {
    /**
     * replace repository name with your own repositories
     */
    // 'emma-cli': github,
  },
})

/* Generates labelsync.yml into the root of repository. */
make({
  configs: [config],
})
