import { Label, Repository, LabelGroup } from './models'

export const label: Label = {
  name: 'scope/app',
  color: '#3BDB8D',
  description: 'Indicates issues related to app.',
  groups: [],
  repositories: [],
}

export const repository: Repository = {
  name: 'maticzav/graphql-shield',
  labels: [],
  groups: [],
}

export const group: LabelGroup = {
  name: 'common labels',
  labels: [],
  repositories: [],
}
