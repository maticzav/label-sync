import { LabelSyncOptions } from './sync'
import { RepositoryConfig } from '../../types'
import { GithubLabel, GithubRepository } from '../../github'

export type LabelSyncReport = {
  repository: GithubRepository
  config: RepositoryConfig
  options: LabelSyncOptions
  additions: GithubLabel[]
  updates: GithubLabel[]
  removals: GithubLabel[]
}
