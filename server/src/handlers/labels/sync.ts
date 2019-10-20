import * as e from 'fp-ts/lib/Either'
import * as t from 'fp-ts/lib/Task'
import { Octokit } from 'probot'

import { LSCConfiguration } from '../../data/labelsync/configuration'

import { analyseConfiguration } from './analysis'
import {
  getLabelsDiff,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from './labels'
import { LSSyncReport } from './reporter'

export interface LSSyncError {}

/**
 *
 * Performs a labels sync with configuration.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
export const handleLabelSync = (
  octokit: Octokit,
  owner: string,
  config: LSCConfiguration,
): t.Task<e.Either<LSSyncError, LSSyncReport>> => async () => {
  /**
   * Label Sync handler firstly loads current labels from Github,
   * and new labels from local configuration.
   *
   * After that it generates a diff and creates, updates or deletes
   * label definitions in a particular repository.
   */

  const analysis = await analyseConfiguration(octokit, owner, config)()

  // const additions = await addLabelsToRepository(client, diff.add, repository)
  // const updates = await updateLabelsInRepository(
  //   client,
  //   diff.update,
  //   repository,
  // )
  // const removals = config.strict
  //   ? await removeLabelsFromRepository(client, diff.remove, repository)
  //   : diff.remove

  return e.right({
    repository: repository,
    config,
    additions,
    updates,
    removals,
  })
}
