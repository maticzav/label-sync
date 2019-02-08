import { GithubLabel, GithubIssue, GithubRepository } from '../../github'
import { RepositoryManifest } from '../../manifest'
import { SiblingSyncOptions } from './sync'

export type SiblingSyncReport = {
  repository: GithubRepository
  manifest: RepositoryManifest
  options: SiblingSyncOptions
  issues: SiblingSyncIssueReport[]
}

export type SiblingSyncIssueReport = {
  issue: GithubIssue
  siblings: GithubLabel[]
}
