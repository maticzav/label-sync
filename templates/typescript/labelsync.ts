import { labelsync, repo } from 'label-sync'

/* Repository */
import { prisma } from './repos/prisma'
import { github } from './repos/github'

{{! we use Handlebars to personalise initial configuration. }}

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
