import * as Octokit from '@octokit/rest'
import * as labels from './'

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
  const configuration = labels.getGithubLabelsConfiguration(
    process.env.GITHUB_WORKSPACE,
  )

  if (!configuration) {
    throw new Error('No configuration file found!')
  }

  const newLabels = labels.getGithubLabelsFromConfiguration(configuration)

  // Github
  const repository = labels.getRepositoryFromName(process.env.GITHUB_REPOSITORY)

  if (!repository) {
    throw new Error('Cannot decode the provided repository name.')
  }

  const currentLabels = await labels.getRepostioryLabels(client, repository)

  /**
   * Diff
   */

  const diff = labels.getLabelsDiff(currentLabels, newLabels)

  /**
   * Sync
   */
  await labels.addLabelsToRepository(client, diff.add, repository)

  await labels.updateLabelsInRepository(client, diff.update, repository)

  if (configuration.strict) {
    await labels.removeLabelsFromRepository(client, diff.remove, repository)
  }

  return true
}
