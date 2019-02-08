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
  githubToken: string
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
  config: Config,
  options: SyncOptions,
): Promise<SyncReport> {
  /* Authentication */

  const client = new Octokit({
    headers: {
      accept: 'application/vnd.github.symmetra-preview+json',
    },
  })

  client.authenticate({
    type: 'app',
    token: options.githubToken,
  })

  /* Sync */

  const { configurations, errors } = getRepositoriesFromConfiguration(config)

  const syncs = await Promise.all(configurations.map(handleRepository))

  return {
    config: config,
    options: options,
    syncs: syncs,
    errors: errors,
  }

  /**
   * Helper functions
   */
  async function handleRepository(configuration: {
    repository: GithubRepository
    config: RepositoryConfig
  }): Promise<RepositorySyncReport> {
    /**
     * Firstly, perform sync labels. After that obtain a manifest of the
     * repository and perform siblings sync.
     */

    const labelSync = await handleLabelSync(
      client,
      configuration.repository,
      configuration.config,
      options,
    )

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
        labels: labelSync,
      }
    }

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
