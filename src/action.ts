import * as Octokit from '@octokit/rest'
import {
  getGithubLabelsConfiguration,
  getGithubLabelsFromConfiguration,
  getRepositoryFromName,
  getRepostioryLabels,
  getLabelsDiff,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from '.'

/* istanbul ignore next */
if (!(process.env.NODE_ENV === 'test')) main()

/**
 * Action
 */

export async function main(): Promise<boolean> {
  if (
    !process.env.GITHUB_TOKEN ||
    !process.env.GITHUB_WORKSPACE ||
    !process.env.GITHUB_HOME ||
    !process.env.GITHUB_REPOSITORY ||
    !process.env.GITHUB_EVENT_NAME ||
    !process.env.GITHUB_REF
  ) {
    throw new Error('Missing Github configuration!')
  }

  /**
   * Authentication
   */

  const client = new Octokit()

  client.authenticate({
    type: 'app',
    token: process.env.GITHUB_TOKEN,
  })

  /**
   * Labels
   */

  // Local
  const configuration = getGithubLabelsConfiguration(
    process.env.GITHUB_WORKSPACE,
  )

  if (!configuration) {
    throw new Error('No configuration file found!')
  }

  const newLabels = getGithubLabelsFromConfiguration(configuration)

  // Github
  const repository = getRepositoryFromName(process.env.GITHUB_REPOSITORY)

  if (!repository) {
    throw new Error('Cannot decode the provided repository name.')
  }

  const currentLabels = await getRepostioryLabels(client, repository)

  /**
   * Diff
   */

  const diff = getLabelsDiff(currentLabels, newLabels)

  /**
   * Sync
   */
  await addLabelsToRepository(client, diff.add, repository)

  await updateLabelsInRepository(client, diff.update, repository)

  if (configuration.strict) {
    await removeLabelsFromRepository(client, diff.remove, repository)
  }

  return true
}
