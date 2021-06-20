/**
 * This file contains code associated with repository creation and handles label syncing.
 */

import { Handler } from '../event'
import { sync } from '../handlers/sync'

// MARK: - Event

export const handler: Handler = (on, { data }) => {
  /**
   * New repository created
   *
   * Tasks:
   *  - check if there's a wildcard configuration
   *  - sync labels on that repository
   */
  on('repository.created', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()

    ctx.log.info(`New repository ${repo} in ${owner}.`)

    const config = await data.config(owner, repo)

    /* istanbul ignore if */
    if (config === null) {
      ctx.log.info(`No configuration, skipping sync.`)
      return
    }

    ctx.log.info(`Performing sync on ${repo}.`)

    await sync(ctx.octokit, { owner, repo, config })

    ctx.log.info(`Repository synced ${repo}.`)
  })
}
