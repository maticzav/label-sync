/**
 * This file contains code associated with events related to code
 * changes (e.g. pushes) that affect the state of labels.
 */

import ml from 'multilines'
import os from 'os'

import * as configs from '../config'
import { Handler } from '../event'
import * as gh from '../github'
import * as sync from '../handlers/sync'
import * as language from '../language'

// MARK: - Event

export const handler: Handler = (on, { data }) => {
  /**
   * Pull Request event
   *
   * Tasks:
   *  - review changes introduced,
   *  - open issues,
   *  - review changes.
   */
  on('pull_request', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name
    const ref = ctx.payload.pull_request.head.ref

    ctx.log.info(`PullRequest action: ${ctx.payload.action}`)

    /* istanbul ignore if */
    if (!configs.isConfigRepo(owner, repo)) {
      ctx.log.info(`Not configuration repository, skipping pr overview.`)
      return
    }

    /**
     * We check if the configuration changed in this pull request.
     */
    const compare = await gh.getPullRequestChanges(ctx.octokit, {
      owner: owner,
      repo: repo,
      base: ctx.payload.pull_request.base.ref,
      head: ctx.payload.pull_request.head.ref,
    })

    const changed = compare.every((f) => f.filename !== configs.LS_CONFIG_PATH)

    /* istanbul ignore next */
    if (!changed) {
      ctx.log.info(`Configuration didn't change, skipping review.`)
      return
    }

    // Actions
    switch (ctx.payload.action) {
      case 'opened':
      case 'reopened':
      case 'ready_for_review':
      case 'review_requested':
      case 'synchronize':
      case 'edited': {
        /**
         * Review the pull request and update check run.
         */
        gh.check(
          ctx.octokit,
          {
            repo,
            owner,
            name: 'label-sync/overview',
            sha: ctx.payload.pull_request.head.sha,
          },
          review,
        )

        break
        //
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
      case 'review_request_removed':
      /* istanbul ignore next */
      case 'unassigned':
      /* istanbul ignore next */
      case 'unlabeled':
      /* istanbul ignore next */
      case 'unlocked': {
        /* Ignore other events. */
        ctx.log.info(`Ignoring event ${ctx.payload.action}.`)
        return
      }
      /* istanbul ignore next */
      default: {
        /* Log unsupported pull_request action. */
        /* prettier-ignore */
        ctx.log.warn(`Unhandled PullRequest action: ${ctx.payload.action}`)
        return
      }
    }

    //

    /**
     * Performs a review of the configuration.
     */
    async function review(): Promise<gh.CheckResult> {
      /* Load configuration */
      const configRaw = await gh.getFile(ctx.octokit, {
        owner,
        repo,
        ref,
        path: configs.LS_CONFIG_PATH,
      })

      /* Skip the pull request if there's no configuraiton. */
      /* istanbul ignore next */
      if (configRaw === null) {
        ctx.log.info(`No configuration, skipping comment.`)
        return {
          success: false,
          title: `No configuration, skipping comment.`,
          summary: `Please add a configuration file.`,
        }
      }

      // Load the plan and parse the configuration.
      const plan = await data.plan(owner)
      const [error, config] = configs.parse({ plan: plan, input: configRaw })

      /* Skips invalid configuration. */
      /* istanbul ignore if */
      if (error !== null) {
        ctx.log.info(`Invalid configuration on ${ref}`, {
          meta: {
            config: JSON.stringify(config),
            error: error,
          },
        })

        const report = ml`
        | Your configuration seems a bit strange. Here's what I am having problems with:
        |
        | ${error}
        `

        return {
          success: false,
          title: `Invalid configuration`,
          summary: report,
        }
      }

      ctx.log.info(`Configration loaded configuration on ${ref}`, {
        meta: {
          config: JSON.stringify(config),
        },
      })

      /* Verify that we can access all configured files. */
      const access = await gh.checkInstallationAccess(ctx.octokit, {
        repos: configs.configRepos(config!),
      })

      /* Skip configurations that we can't access. */
      switch (access.status) {
        case 'Sufficient': {
          ctx.log.info(`Simulating sync.`)

          /* Fetch changes to repositories. */
          const changes = await Promise.all(
            configs.configRepos(config!).map(async (repo) => {
              const repocfg = config!.repos.get(repo)!

              const diff = await sync.changes(ctx.octokit, {
                owner,
                repo,
                labels: repocfg.labels,
              })

              return {
                repo,
                config: repocfg.config,
                changes: diff,
              }
            }),
          )

          /* Comment on pull request. */
          const successful = changes.every((c) => c.changes !== null)
          const report = language.generateReport(changes)

          return {
            success: successful,
            title: `Overview of the changes`,
            summary: report,
          }
        }
        case 'Insufficient': {
          ctx.log.info(`Insufficient permissions`)

          /* Opens up an issue about insufficient permissions. */
          const body = ml`
          | It seems like this configuration stretches beyond repositories we can access. 
          | Please update it so we can help you as best as we can.
          |
          | _Missing repositories:_
          | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
          `

          return {
            success: false,
            title: `Insufficient access`,
            summary: body,
          }
        }
      }
    }

    //
  })
}
