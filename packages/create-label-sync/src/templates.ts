import { Template } from 'creato'

export const templates: Template[] = [
  {
    name: 'json',
    description: 'JSON template with basic CircleCI config.',
    repo: {
      uri: 'https://github.com/maticzav/label-sync',
      branch: 'master',
      path: '/examples/with-circleci',
    },
  },
  {
    name: 'javascript',
    description: 'JavaScript template with basic CircleCI config.',
    repo: {
      uri: 'https://github.com/maticzav/label-sync',
      branch: 'master',
      path: '/examples/with-javascript',
    },
  },
  {
    name: 'typescript',
    description: 'CircleCI template with basic CircleCI config.',
    repo: {
      uri: 'https://github.com/maticzav/label-sync',
      branch: 'master',
      path: '/examples/with-typescript',
    },
  },
]
