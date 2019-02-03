import Octokit from '@octokit/rest'

import {
  Config,
  getRepositoriesFromConfiguration,
  RepositoryConfig,
} from './config'
import {
  GithubRepository,
  getRepositoryLabels,
  getRepositoryIssues,
  GithubIssue,
} from './github'
import {
  getGithubLabelsFromRepositoryConfig,
  getLabelsDiff,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from './labels'
import {
  LabelSyncReport,
  SyncReport,
  SiblingSyncReport,
  SiblingSyncIssueSyncReport,
  SiblingSyncSuccessIssueSyncReport,
  SiblingSyncErrorIssueSyncReport,
  RepositorySyncReport,
  RepositorySyncSuccessReport,
  RepositorySyncErrorReport,
  RepositorySyncConfigurationErrorReport,
} from './reporters'
import {
  getRepositorySiblingsManifest,
  assignSiblingsToIssue,
  RepositoryManifest,
} from './siblings'

/**
 * Handlers
 */

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

    if (labelSync.status === 'error') {
      return {
        status: 'error',
        report: {
          repository: repository,
          config: config,
          message: labelSync.report.message,
        },
      }
    }

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
        additions: labelSync.report.additions,
        updates: labelSync.report.updates,
        removals: labelSync.report.removals,
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

export interface LabelSyncOptions {
  dryRun: boolean
}

/**
 *
 * Handles Label Sync in a repository.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
async function handleLabelSync(
  client: Octokit,
  repository: GithubRepository,
  config: RepositoryConfig,
  options: LabelSyncOptions,
): Promise<LabelSyncReport> {
  /**
   * Label Sync handler firstly loads current labels from Github,
   * and new labels from local configuration.
   *
   * After that it generates a diff and creates, updates or deletes
   * label definitions in a particular repository.
   */

  const currentLabels = await getRepositoryLabels(client, repository)
  const newLabels = getGithubLabelsFromRepositoryConfig(config)

  const diff = getLabelsDiff(currentLabels, newLabels)

  /* Sync */

  if (options.dryRun) {
    return {
      status: 'success',
      report: {
        repository: repository,
        config,
        additions: diff.add,
        updates: diff.update,
        removals: diff.remove,
      },
    }
  }
  try {
    const additions = await addLabelsToRepository(client, diff.add, repository)
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
        repository: repository,
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
        repository: repository,
        config: config,
        message: err.message,
      },
    }
  }
}

export interface SiblingSyncOptions {}

/**
 *
 * Handles Sibling Sync in a repository.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
export async function handleSiblingSync(
  client: Octokit,
  repository: GithubRepository,
  config: RepositoryConfig,
  options: SiblingSyncOptions,
): Promise<SiblingSyncReport> {
  /**
   * Sibling Sync handler firstly verifies the configuration and
   * generates manifest of the configuration.
   *
   * Once configuration is validated, it queries all
   * pull requests and issues and applies siblings to existing
   * labels according to the manifest.
   */

  const manifest = await getRepositorySiblingsManifest(
    client,
    repository,
    config,
  )

  if (manifest.status === 'err') {
    return {
      status: 'error',
      message: manifest.message,
    }
  }

  /* Sync */

  const issues = await getRepositoryIssues(client, repository)
  const issuesSync = await Promise.all(issues.map(handleIssue))

  const report = generateReport(issuesSync)

  return {
    status: 'success',
    repository: repository,
    config: config,
    manifest: manifest.manifest,
    successes: report.successes,
    errors: report.errors,
  }

  /*
   *
   * Helper functions
   *
   */

  async function handleIssue(
    issue: GithubIssue,
  ): Promise<SiblingSyncIssueSyncReport> {
    const siblings = await assignSiblingsToIssue(
      client,
      repository,
      issue,
      (manifest as { manifest: RepositoryManifest }).manifest,
    )

    if (siblings.status === 'err') {
      return {
        status: 'error',
        report: {
          issue: issue,
          message: siblings.message,
        },
      }
    }

    return {
      status: 'success',
      report: {
        issue: issue,
        siblings: siblings.siblings,
      },
    }
  }

  /**
   *
   * Merges multiple reports into one.
   *
   * @param repositoryReports
   */
  function generateReport(
    repositoryReports: SiblingSyncIssueSyncReport[],
  ): {
    successes: SiblingSyncSuccessIssueSyncReport[]
    errors: SiblingSyncErrorIssueSyncReport[]
  } {
    const report = repositoryReports.reduce<{
      successes: SiblingSyncSuccessIssueSyncReport[]
      errors: SiblingSyncErrorIssueSyncReport[]
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
