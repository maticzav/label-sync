import Octokit from '@octokit/rest'

import { handleLabelSync } from '../../handlers/labels'
import { handleSiblingSync } from '../../handlers/siblings'
import { Config, getRepositoriesFromConfiguration } from './config'
import { SyncReport, RepositorySyncReport } from './reporter'
import { GithubRepository } from '../../github'
import { RepositoryConfig } from '../../types'
import { getRepositoryManifest } from '../../manifest'

export interface SyncOptions {
  dryRun: boolean
}

/**
 *
 * Handles repository sync by performing Label Sync first,
 * and Siblings Sync later.
 *
 * @param config
 * @param options
 */
export async function handleSync(
  client: Octokit,
  config: Config,
  options: SyncOptions,
): Promise<SyncReport> {
  const { configurations, errors } = getRepositoriesFromConfiguration(config)
  const syncs = await Promise.all(configurations.map(handleRepository))

  return {
    config: config,
    options: options,
    syncs: syncs,
    configErrors: errors,
  }

  /* Helper functions */
  async function handleRepository(configuration: {
    repository: GithubRepository
    config: RepositoryConfig
  }): Promise<RepositorySyncReport> {
    /**
     * Firstly, verify configuration. After that, sync labels and then
     * add missing siblings to existing issues.
     */

    const manifest = await getRepositoryManifest(
      client,
      configuration.repository,
      configuration.config,
    )

    /* Report manifest generation error */
    if (manifest.status !== 'ok') {
      return {
        status: 'error',
        message: `Error generating manifest: ${manifest.message}`,
        repository: configuration.repository,
        config: configuration.config,
      }
    }

    const labelSync = await handleLabelSync(
      client,
      configuration.repository,
      configuration.config,
      options,
    )

    const siblingsSync = await handleSiblingSync(
      client,
      configuration.repository,
      manifest.manifest,
      options,
    )

    return {
      status: 'success',
      repository: configuration.repository,
      config: configuration.config,
      manifest: manifest.manifest,
      labels: labelSync,
      siblings: siblingsSync,
    }
  }
}
