import { Label, Repository, LabelGroup } from './models'

export const labels: Label[] = [
  {
    name: 'scope/app',
    color: '#3BDB8D',
    description: 'Indicates issues related to app.',
    groups: [],
    repositories: [],
  },
  {
    name: 'scope/internal',
    color: '#3BDB8D',
    description: 'Indicates issues related to app.',
    groups: [],
    repositories: [],
  },
  {
    name: 'kind/feature',
    color: '#3BDB8D',
    description: 'Indicates issues related to app.',
    groups: [],
    repositories: [],
  },
]

export const repository: Repository = {
  name: 'maticzav/graphql-shield',
  labels: [],
  groups: [],
}

export const group: LabelGroup = {
  name: 'common labels',
  labels: [labels[0]!, labels[1]!],
  repositories: [],
}
