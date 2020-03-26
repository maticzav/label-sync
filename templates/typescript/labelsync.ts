import { labelsync } from 'label-sync'

/* Repository */
import { prisma } from './repos/prisma'
import { github } from './repos/github'

/* Config */
labelsync({
  repos: {
    // prisma,
    // github,
  },
})
