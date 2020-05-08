{{! we use Handlebars to personalise initial configuration. }}
{{! IF YOU SEE THIS LINE SOMETHING BROKE. PLEASE RETRY SCAFFOLDING }}

import { labelsync, repo } from 'label-sync'

/* Repository */
import { prisma } from './repos/prisma'
import { github } from './repos/github'

/* Config */
labelsync({
  repos: {
    /* Check presets in the repos folder. */
    // prisma,
    // github,
    /* Personalized repositories */
    {{#each repositories}}
    {{#with this}}
    "{{name}}": repo({
      config: {
        removeUnconfiguredLabels: false
      },
      labels: []
    }),
    {{/with}}
    {{/each}}
  },
})
