import Octokit from '@octokit/rest'

import { GithubRepository, getRepositoryLabels } from '../../github'
import { getLabelsInConfiguration } from '../../manifest'
import { RepositoryConfig } from '../../types'

import {
  getLabelsDiff,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from './labels'
import { LabelSyncReport } from './reporter'

/**
 *
 * Handles Label Sync in a repository.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
export async function handleLabelSync(
  client: Octokit,
  repository: GithubRepository,
  config: RepositoryConfig,
): Promise<LabelSyncReport> {
  /**
   * Label Sync handler firstly loads current labels from Github,
   * and new labels from local configuration.
   *
   * After that it generates a diff and creates, updates or deletes
   * label definitions in a particular repository.
   */

  const currentLabels = await getRepositoryLabels(client, repository)
  const newLabels = getLabelsInConfiguration(config)

  const diff = getLabelsDiff(currentLabels, newLabels)

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
    repository: repository,
    config,
    additions,
    updates,
    removals,
  }
}
