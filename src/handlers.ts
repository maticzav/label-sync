import * as Octokit from '@octokit/rest'
import {
  RepositoryConfig,
  GithubLabel,
  getRepostioryLabels,
  getGithubLabelsFromRepositoryConfig,
  getRepositoryFromName,
  getLabelsDiff,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from './labels'

/**
 * Handlers
 */

export interface RepositorySyncReport {
  name: string
  configuration: RepositoryConfig
  additions: GithubLabel[]
  updates: GithubLabel[]
  removals: GithubLabel[]
}

/**
 *
 * Handles report installation.
 *
 * @param client
 * @param name
 * @param config
 */
export async function handleRepository(
  client: Octokit,
  name: string,
  configuration: RepositoryConfig,
): Promise<RepositorySyncReport> {
  const repository = getRepositoryFromName(name)

  if (!repository) {
    throw new Error(`Cannot decode the provided repository name ${name}`)
  }

  /**
   * Labels
   */

  // Github
  const currentLabels = await getRepostioryLabels(client, repository)

  // Local
  const newLabels = getGithubLabelsFromRepositoryConfig(configuration)

  /**
   * Diff
   */

  const diff = getLabelsDiff(currentLabels, newLabels)

  /**
   * Sync
   */
  const additions = await addLabelsToRepository(client, diff.add, repository)
  const updates = await updateLabelsInRepository(
    client,
    diff.update,
    repository,
  )
  const removals = configuration.strict
    ? await removeLabelsFromRepository(client, diff.remove, repository)
    : []

  return {
    name,
    configuration,
    additions,
    updates,
    removals,
  }
}
