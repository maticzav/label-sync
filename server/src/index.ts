import Webhooks = require('@octokit/webhooks')
import ml from 'multilines'
import os from 'os'
import { Application, Context, Octokit } from 'probot'

import { parseConfig, LSCConfiguration } from './configuration'
import * as maybe from './data/maybe'
import {
  getFile,
  openIssue,
  createPRComment,
  removeLabelsFromRepository,
} from './github'
import { handleLabelSync } from './handlers/labels'
import { generateHumanReadableReport } from './language/labels'

/* Constants */

/**
 * Configuration repository is the repository which LabelSync
 * uses to determine the configuration of the service.
 *
 * @param organization
 */
export const getLSConfigRepoName = (owner: string) => `${owner}-labelsync`

/**
 * Configuration file path determines the path of the file in the repositoy
 * that we use to gather configuration information from.
 *
 * It should always be in YAML format.
 */
export const LS_CONFIG_PATH = 'labelsync.yml'

/* Application */

export default (app: Application) => {
  /**
   * Installation event
   *
   * Performs an onboarding configuration to make it easier to get acquainted
   * with LabelSync.
   *
   * Tasks:
   *  - check whether there exists a configuration repository,
   *  - create a configuration repository from template.
   */
  // app.on('installation.created', async ({ github }) => {})

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
    if (configRepo !== repo) return

    /* Skip non default branch */
    /* istanbul ignore if */
    if (defaultRef !== ref) return

    /* Load configuration */
    const configRaw = await getFile(
      github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )
    const config = maybe.andThen(configRaw, parseConfig)

    log.debug({ config }, `Loaded configuration for ${owner}.`)

    /* Skips invalid configuration. */
    /* istanbul ignore next */
    if (config === null) return

    /* Verify that we can access all configured files. */
    const access = await checkInstallationAccess(
      github,
      Object.keys(config.repos),
    )

    /* Skip configurations that we can't access. */
    switch (access.status) {
      case 'Sufficient': {
        /* Performs sync. */
        for (const repo in config.repos) {
          await Promise.all([
            handleLabelSync(github, owner, repo, config.repos[repo], true),
          ])
        }

        return
      }
      case 'Insufficient': {
        /* Opens up an issue about insufficient permissions. */
        const title = 'LabelSync - Insufficient permissions'
        const body = ml`
        | # Insufficient permissions
        |
        | Hi there,
        | We have noticed that your configuration stretches beyond
        | repositories we can access. Please update it so we can help
        | you as best as we can.
        |
        | _Missing repositories:_
        | ${access.missing.map(missing => ` * ${missing}`).join(os.EOL)}
        |
        | Best,
        | LabelSync Team
        `

        await openIssue(github, owner, configRepo, title, body)

        return
      }
    }
  })

  /**
   * Pull Request event
   *
   * Tasks:
   *  - review changes introduced,
   *  - open issues,
   *  - review changes.
   */
  app.on('pull_request', async ({ github, payload, log }) => {
    const owner = payload.repository.owner.login
    const repo = payload.repository.name
    const ref = payload.pull_request.head.ref
    const number = payload.pull_request.number

    const configRepo = getLSConfigRepoName(owner)

    /* istanbul ignore if */
    if (configRepo !== repo) return

    /* Load configuration */
    const configRaw = await getFile(
      github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )
    const config = maybe.andThen(configRaw, parseConfig)

    log.debug({ config }, `Loaded configuration for ${owner}/${ref}.`)

    /* Skips invalid configuration. */
    /* istanbul ignore if */
    if (config === null) return

    switch (payload.action) {
      case 'opened':
      case 'edited': {
        /* Review pull request. */

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(
          github,
          Object.keys(config.repos),
        )

        /* Skip configurations that we can't access. */
        switch (access.status) {
          case 'Sufficient': {
            /* Fetch changes to repositories. */
            const reports = await Promise.all(
              Object.keys(config.repos).map(repo =>
                handleLabelSync(github, owner, repo, config.repos[repo], false),
              ),
            )

            const report = generateHumanReadableReport(reports)

            /* Comment on a PR in a human friendly way. */
            await createPRComment(github, owner, configRepo, number, report)

            return
          }
          case 'Insufficient': {
            /* Opens up an issue about insufficient permissions. */
            const body = ml`
            | It seems like this configuration stretches beyond
            | repositories we can access. Please update it so we can help
            | you as best as we can.
            |
            | _Missing repositories:_
            | ${access.missing.map(missing => ` * ${missing}`).join(os.EOL)}
            `

            await createPRComment(github, owner, configRepo, number, body)

            return
          }
        }
      }
      /* istanbul ignore next */
      case 'assigned':
      /* istanbul ignore next */
      case 'closed':
      /* istanbul ignore next */
      case 'labeled':
      /* istanbul ignore next */
      case 'locked':
      /* istanbul ignore next */
      case 'ready_for_review':
      /* istanbul ignore next */
      case 'reopened':
      /* istanbul ignore next */
      case 'review_request_removed':
      /* istanbul ignore next */
      case 'review_requested':
      /* istanbul ignore next */
      case 'unassigned':
      /* istanbul ignore next */
      case 'unlabeled':
      /* istanbul ignore next */
      case 'unlocked':
      /* istanbul ignore next */
      case 'synchronize': {
        /* Ignore other events. */
        return
      }
      /* istanbul ignore next */
      default: {
        /* Log unsupported pull_request action. */
        log.error(`Unsupported pull_request event: ${payload.action}`)

        return
      }
    }
  })
  /**
   * Label Created
   *
   * Tasks:
   *  - figure out whether repository is strict
   *  - prune unsupported labels.
   */
  app.on(
    'label.created',
    withSources(async ctx => {
      const owner = ctx.payload.sender.login
      const repo = ctx.payload.repository.name
      const config = ctx.sources.config.repos[repo]
      const label = ctx.payload.label

      /* Ignore changes in non-strict config */
      /* istanbul ignore if */
      if (!config.strict) return

      /* Ignore complying changes. */
      /* istanbul ignore if */
      if (config.labels.hasOwnProperty(label.name)) return

      /* Prune unsupported labels in strict repositories. */
      await removeLabelsFromRepository(
        ctx.github,
        { repo, owner },
        [label],
        config.strict,
      )
    }),
  )
}

interface Sources {
  config: LSCConfiguration
}

/**
 * Wraps a function inside a sources loader.
 */
function withSources<
  C extends
    | Webhooks.WebhookPayloadCheckRun
    | Webhooks.WebhookPayloadIssues
    | Webhooks.WebhookPayloadLabel
    | Webhooks.WebhookPayloadPullRequest,
  T
>(
  fn: (ctx: Context<C> & { sources: Sources }) => Promise<T>,
): (ctx: Context<C>) => Promise<T | undefined> {
  return async ctx => {
    const owner = ctx.payload.sender.login
    const repo = getLSConfigRepoName(owner)
    const ref = `refs/heads/${ctx.payload.repository.default_branch}`

    /* Load configuration */
    const configRaw = await getFile(
      ctx.github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )
    const config = maybe.andThen(configRaw, parseConfig)

    /* Skips invlaid config. */
    /* istanbul ignore if */
    if (config === null) return
    ;(ctx as Context<C> & { sources: Sources }).sources = { config }

    return fn(ctx as Context<C> & { sources: Sources })
  }
}

type InstallationAccess =
  | { status: 'Sufficient' }
  | { status: 'Insufficient'; missing: string[] }

async function checkInstallationAccess(
  github: Octokit,
  repos: string[],
): Promise<InstallationAccess> {
  const {
    data: { repositories },
  } = await github.apps.listRepos({ per_page: 100 })

  const missing = repos.filter(repo =>
    repositories.every(({ name }) => repo !== name),
  )

  if (missing.length === 0) {
    return { status: 'Sufficient' }
  }

  return {
    status: 'Insufficient',
    missing: missing,
  }
}
