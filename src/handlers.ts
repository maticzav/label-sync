import * as Octokit from '@octokit/rest'
import {
  Config,
  RepositoryConfig,
  GithubLabel,
  getGithubLabelsFromRepositoryConfig,
  getRepositoriesFromConfiguration,
  getRepositoryFromName,
  getRepostioryLabels,
  getLabelsDiff,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from './labels'

/**
 * Handlers
 */

export interface SyncOptions {
  dryRun: boolean
  githubToken: string
}

export interface SyncReport {
  config: Config
  options: SyncOptions
  successes: RepositorySyncSuccessReport[]
  errors: RepositorySyncErrorReport[]
}

export interface RepositorySyncSuccessReport {
  name: string
  config: RepositoryConfig
  additions: GithubLabel[]
  updates: GithubLabel[]
  removals: GithubLabel[]
}

export interface RepositorySyncErrorReport {
  name: string
  config: RepositoryConfig
  message: string
}

export type RepositorySyncReport =
  | {
      status: 'success'
      report: RepositorySyncSuccessReport
    }
  | {
      status: 'error'
      report: RepositorySyncErrorReport
    }

export async function handleSync(
  config: Config,
  options: SyncOptions,
): Promise<SyncReport> {
  /**
   * Authentication
   */

  const client = new Octokit()

  client.authenticate({
    type: 'app',
    token: options.githubToken,
  })

  /**
   * Repositories Sync
   */

  const repositories = getRepositoriesFromConfiguration(config)
  const repositoryHandlers = repositories.map(repository =>
    handleRepository(repository.name, repository.config),
  )

  const repositoryReports = await Promise.all(repositoryHandlers)

  const report = generateSyncReport(repositoryReports)

  return {
    config: config,
    options: options,
    successes: report.successes,
    errors: report.errors,
  }

  /**
   * Helper functions
   */
  async function handleRepository(
    name: string,
    config: RepositoryConfig,
  ): Promise<RepositorySyncReport> {
    const repository = getRepositoryFromName(name)

    if (!repository) {
      return {
        status: 'error',
        report: {
          name: name,
          config: config,
          message: `Cannot decode the provided repository name ${name}`,
        },
      }
    }

    /**
     * Labels
     */

    // Github
    const currentLabels = await getRepostioryLabels(client, repository)

    // Local
    const newLabels = getGithubLabelsFromRepositoryConfig(config)

    /**
     * Diff
     */

    const diff = getLabelsDiff(currentLabels, newLabels)

    /**
     * Sync
     */

    if (options.dryRun) {
      return {
        status: 'success',
        report: {
          name,
          config,
          additions: diff.add,
          updates: diff.update,
          removals: diff.remove,
        },
      }
    } else {
      /**
       * Sync
       */
      try {
        const additions = await addLabelsToRepository(
          client,
          diff.add,
          repository,
        )
        const updates = await updateLabelsInRepository(
          client,
          diff.update,
          repository,
        )
        const removals = config.strict
          ? await removeLabelsFromRepository(client, diff.remove, repository)
          : diff.remove

        return {
          status: 'success',
          report: {
            name,
            config,
            additions,
            updates,
            removals,
          },
        }
      } catch (err) {
        return {
          status: 'error',
          report: {
            name: name,
            config: config,
            message: err.message,
          },
        }
      }
    }
  }

  function generateSyncReport(
    repositoryReports: RepositorySyncReport[],
  ): {
    successes: RepositorySyncSuccessReport[]
    errors: RepositorySyncErrorReport[]
  } {
    const report = repositoryReports.reduce<{
      successes: RepositorySyncSuccessReport[]
      errors: RepositorySyncErrorReport[]
    }>(
      (acc, report) => {
        switch (report.status) {
          case 'success':
            return { ...acc, successes: [...acc.successes, report.report] }
          case 'error':
            return { ...acc, errors: [...acc.errors, report.report] }
        }
      },
      { successes: [], errors: [] },
    )

    return report
  }
}
