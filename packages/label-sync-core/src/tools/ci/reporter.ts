import { Config, ConfigError } from './config'
import { SyncOptions } from './sync'
import { GithubRepository } from '../../github'
import { RepositoryConfig } from '../../types'
import { LabelSyncReport } from '../../handlers/labels'
import { RepositoryManifest } from '../../manifest'
import { SiblingSyncReport } from '../../handlers/siblings'

export type SyncReport = {
  config: Config
  options: SyncOptions
  syncs: RepositorySyncReport[]
  configErrors: ConfigError[]
}

export type RepositorySyncReport =
  | {
      status: 'success'
      repository: GithubRepository
      config: RepositoryConfig
      manifest: RepositoryManifest
      labels: LabelSyncReport
      siblings: SiblingSyncReport
    }
  | {
      status: 'error'
      message: string
      repository: GithubRepository
      config: RepositoryConfig
    }
