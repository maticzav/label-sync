import { GithubLabel, GithubRepository } from '../../github'
import { RepositoryConfig } from '../../types'

import { LabelSyncOptions } from './sync'

export type LabelSyncReport = {
  repository: GithubRepository
  config: RepositoryConfig
  options: LabelSyncOptions
  additions: GithubLabel[]
  updates: GithubLabel[]
  removals: GithubLabel[]
}
