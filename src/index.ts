import * as Octokit from '@octokit/rest'

import { handleRepository } from './handlers'
import { getRepositoriesFromConfiguration, Config } from './labels'

import prisma from './config'
import { generateSyncReport } from './reporters'

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') main(prisma)

/**
 * Main
 */

async function main(configuration: Config): Promise<string> {
  if (!process.env.GITHUB_TOKEN) {
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
   * Repositories Sync
   */

  const repositories = getRepositoriesFromConfiguration(configuration)
  const actions = repositories.map(repository =>
    handleRepository(client, repository.name, repository.config),
  )
  const reports = await Promise.all(actions)

  /**
   * Report generation.
   */
  const report = generateSyncReport(reports)

  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'test') console.log(report)

  return report
}
