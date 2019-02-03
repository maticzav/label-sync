import mls from 'multilines'
import Octokit from '@octokit/rest'
import * as probot from 'probot'

import { Config, getRepositoriesFromConfiguration } from './config'
import { GithubIssue, GithubRepository } from './github'
import {
  RepositoryManifest,
  assignSiblingsToIssue,
  getRepositorySiblingsManifest,
} from './siblings'
import { withDefault } from './utils'

export interface BotOptions {
  logger: Console
  githubToken: string
}

/**
 *
 * Creates a Github Bot instance based on provided configuration.
 *
 * @param config
 * @param logger
 */
export async function getGithubBot(
  config: Config,
  options: BotOptions,
): Promise<((app: probot.Application) => void)> {
  /* Options */

  const logger = withDefault(console)(options.logger)

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

  /* Generate manifest */

  const manifest = await generateBotManifest(client, config)

  /* Github Bot */

  const bot = (app: probot.Application) => {
    app.on('issues.labeled', async (context: probot.Context) => {
      const repository: GithubRepository = context.payload.repository
      const issue: GithubIssue = context.payload.issue

      /* Check repository configuration */
      if (!Object.keys(manifest).includes(repository.full_name)) {
        logger.log(`No such repository configuration, ${repository}.`)
        return
      }

      const res = await assignSiblingsToIssue(
        context.github,
        repository,
        issue,
        manifest[repository.full_name],
      )

      if (res.status === 'ok') {
        logger.log(
          mls`
          | Successfully applied siblings to issue ${issue.number}: 
          | ${res.siblings}
          `,
        )
      } else {
        logger.log(`Something went wrong: ${res.message}`)
      }
    })

    app.on('pull_request.labeled', async (context: probot.Context) => {
      const repository: GithubRepository = context.payload.repository
      const pr: GithubIssue = context.payload.pull_request

      /* Check repository configuration */
      if (!Object.keys(manifest).includes(repository.full_name)) {
        logger.log(`No such repository configuration, ${repository}.`)
        return
      }

      const res = await assignSiblingsToIssue(
        context.github,
        repository,
        pr,
        manifest[repository.full_name],
      )

      if (res.status === 'ok') {
        logger.log(
          mls`
          | Successfully applied siblings to ${pr.number} pull request: 
          | ${res.siblings}
          `,
        )
      } else {
        logger.log(`Something went wrong: ${res.message}`)
      }
    })
  }

  return bot

  /* Helper functions */

  /**
   *
   * Generates manifests for each repo and combines them into one.
   *
   * @param config
   */
  async function generateBotManifest(
    github: Octokit,
    config: Config,
  ): Promise<{ [repository: string]: RepositoryManifest }> {
    const repositories = getRepositoriesFromConfiguration(config)

    const manifests = await Promise.all(
      repositories.map(async repository => {
        if (repository.status === 'err') {
          throw new Error(`Couldn't find repository: ${repository.message}.`)
        }

        const manifest = await getRepositorySiblingsManifest(
          github,
          repository.repository,
          repository.config,
        )

        return {
          repository: repository,
          manifest: manifest,
        }
      }),
    )

    const manifest = manifests.reduce((acc, manifest) => {
      if (manifest.manifest.status === 'err') {
        throw new Error(
          `Couldn't generate manifest: ${manifest.manifest.message}.`,
        )
      }

      return {
        ...acc,
        [manifest.repository.repository.full_name]: manifest.manifest.manifest,
      }
    }, {})

    return manifest
  }
}
