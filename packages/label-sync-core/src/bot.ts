import * as probot from 'probot'

import { Config } from './config'
import { RepositoryManifest, assignSiblingsToIssue } from './siblings'

export async function getGithubBot(
  config: Config,
  logger: { log: (log: string) => any } = console,
): Promise<((app: probot.Application) => void)> {
  /* Generate manifest */
  const manifest = await generateBotManifest(config)

  /* Event handler */
  const handleLabel = async (context: probot.Context) => {
    const repository = context.repo()
    const issue = context.issue()

    /* Check repository configuration */
    if (!Object.keys(manifest).includes(repository.repo)) {
      logger.log(`No such repository configuration, ${repository}.`)
      return
    }

    const res = await assignSiblingsToIssue(
      context.github as any, // TODO:
      repository as any, // TODO:
      issue as any, // TODO:
      manifest[repository.repo],
    )

    if (res.status === 'ok') {
      logger.log(`Successfully applied siblings to issues: ${res.siblings}`)
    } else {
      logger.log(`Something went wrong: ${res.message}`)
    }
  }

  /* Github Bot */

  const bot = (app: probot.Application) => {
    app.on('issues.labeled', handleLabel)
    app.on('pull_request.labeled', handleLabel)
  }

  return bot
}

export type LabelSyncBotManifest = { [repository: string]: RepositoryManifest }

export async function generateBotManifest(
  config: Config,
): Promise<LabelSyncBotManifest> {
  return {}
}
