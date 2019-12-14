import { Application, Context } from 'probot'

import { parseConfig, LSCConfiguration } from './configuration'
import * as maybe from './data/maybe'
import { getFile } from './github'
import { handleLabelSync } from './handlers/labels'

/* Constants */

/**
 * Configuration repository is the repository which LabelSync
 * uses to determine the configuration of the service.
 *
 * @param organization
 */
const getLSConfigRepoName = (owner: string) => `${owner}-labelsync`

/**
 * Configuration file path determines the path of the file in the repositoy
 * that we use to gather configuration information from.
 *
 * It should always be in YAML format.
 */
const LS_CONFIG_PATH = 'labelsync.yml'

/* Application */

export default (app: Application) => {
  /**
   * Push Event
   *
   * Listens for changes to the configuration file.
   *
   * Tasks:
   *  - determine whether the configuration file is OK,
   *  - sync labels across repositories (i.e. create new ones, remove old ones)
   *    on master branch,
   *  - perform check runs on non-master branch.
   */
  app.on('push', async ({ payload, github, log }) => {
    const owner = payload.repository.owner.login
    const repo = payload.repository.name
    const ref = payload.ref
    const defaultRef = `refs/heads/${payload.repository.default_branch}`

    const configRepo = getLSConfigRepoName(owner)

    /* istanbul ignore if */
    if (configRepo === repo) return

    /* Ignore changes made to non default refs. */
    if (ref !== defaultRef) return

    /* Load configuration */
    const configRaw = await getFile(
      github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )
    const config = maybe.andThen(configRaw, parseConfig)

    log.debug({ config }, `About to sync ${owner}.`)

    /* Skips invalid configuration. */
    if (config === null) return

    /* Performs sync. */
    for (const repo in config.repos) {
      await Promise.all([
        handleLabelSync(github, owner, repo, config.repos[repo]),
      ])
    }
  })

  /**
   * Label Created
   *
   * Tasks:
   *  - figure out whether repository is strict
   *  - prune unsupported labels.
   */
  app.on('label.created', withSources(async ctx => {}))
}

interface Sources {
  config: LSCConfiguration
}

/**
 * Wraps a function inside a sources loader.
 */
function withSources<C, T>(
  fn: (ctx: Context<C> & { sources: Sources }) => Promise<T>,
): (ctx: Context<C>) => Promise<T | undefined> {
  return async ctx => {
    const owner = ''
    const repo = getLSConfigRepoName(owner)
    const ref = ''

    /* Load configuration */
    const configRaw = await getFile(
      ctx.github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )
    const config = maybe.andThen(configRaw, parseConfig)

    /* Skips invlaid config. */
    if (config === null) return
    ;(ctx as Context<C> & { sources: Sources }).sources = { config }

    return fn(ctx as Context<C> & { sources: Sources })
  }
}
