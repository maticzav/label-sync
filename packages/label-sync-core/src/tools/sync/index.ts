import Octokit from '@octokit/rest'

import {
  Config,
  getRepositoriesFromConfiguration,
  RepositoryConfig,
} from '../../config'
import { GithubRepository } from '../../github'
import { handleLabelSync } from '../../handlers/labels'
import {
  SyncReport,
  RepositorySyncReport,
  RepositorySyncSuccessReport,
  RepositorySyncErrorReport,
  RepositorySyncConfigurationErrorReport,
} from './reporter'
import { handleSiblingSync } from '../../handlers/siblings'

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
  /**
   * Authentication
   */

  const client = new Octokit({
    headers: {
      accept: 'application/vnd.github.symmetra-preview+json',
    },
  })

  client.authenticate({
    type: 'app',
    token: options.githubToken,
  })

  /**
   * Repositories Sync
   */

  const repositories = getRepositoriesFromConfiguration(config)
  const repositoryHandlers = repositories.map(async repository => {
    if (repository.status === 'ok') {
      return handleRepository(repository.repository, repository.config)
    }

    return {
      status: 'config' as 'config',
      report: {
        config: repository.config,
        message: repository.message,
      },
    }
  })

  const repositoryReports = await Promise.all(repositoryHandlers)

  const report = generateSyncReport(repositoryReports)

  return {
    config: config,
    options: options,
    successes: report.successes,
    errors: report.errors,
    configs: report.configs,
  }

  /**
   * Helper functions
   */
  async function handleRepository(
    repository: GithubRepository,
    config: RepositoryConfig,
  ): Promise<RepositorySyncReport> {
    const labelSync = await handleLabelSync(client, repository, config, options)

    const siblingsSync = await handleSiblingSync(
      client,
      repository,
      config,
      options,
    )

    if (siblingsSync.status === 'error') {
      return {
        status: 'error',
        report: {
          repository: repository,
          config: config,
          message: siblingsSync.message,
        },
      }
    }

    return {
      status: 'success',
      report: {
        repository: repository,
        config: config,
        manifest: siblingsSync.manifest,
        additions: labelSync.additions,
        updates: labelSync.updates,
        removals: labelSync.removals,
        siblingsSucesses: siblingsSync.successes,
        siblingsErrors: siblingsSync.errors,
      },
    }
  }

  /**
   *
   * Merges multiple reports into one.
   *
   * @param repositoryReports
   */
  function generateSyncReport(
    repositoryReports: RepositorySyncReport[],
  ): {
    successes: RepositorySyncSuccessReport[]
    errors: RepositorySyncErrorReport[]
    configs: RepositorySyncConfigurationErrorReport[]
  } {
    const report = repositoryReports.reduce<{
      successes: RepositorySyncSuccessReport[]
      errors: RepositorySyncErrorReport[]
      configs: RepositorySyncConfigurationErrorReport[]
    }>(
      (acc, report) => {
        switch (report.status) {
          case 'success':
            return { ...acc, successes: [...acc.successes, report.report] }
          case 'error':
            return { ...acc, errors: [...acc.errors, report.report] }
          case 'config':
            return { ...acc, configs: [...acc.configs, report.report] }
        }
      },
      { successes: [], errors: [], configs: [] },
    )

    return report
  }
}
