/**
 * This file contains code associated with events related to code
 * changes (e.g. pushes) that affect the state of labels.
 */

import ml from 'multilines'
import os from 'os'

import * as configs from '../config'
import * as gh from '../github'
import * as sync from '../handlers/sync'
import * as language from '../language'

import { Handler } from '../event'

// MARK: - Event

export const handler: Handler = (on, { data }) => {
  /**
   * Push Event
   *
   * Listens for changes to the configuration file.
   *
   * Tasks:
   *  - determine whether the configuration file is OK,
   *  - sync labels across repositories (i.e. create new ones, remove old ones)
   *    on master branch,
   *  - perform check runs on non-master branch,
   *  - updates the configuration in the database on valid configuration.
   */
  on('push', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name
    const ref = ctx.payload.ref
    const defaultRef = `refs/heads/${ctx.payload.repository.default_branch}`

    const configRepo = configs.getLSConfigRepoName(owner)

    /* Skip non default branch and other repos pushes. */
    /* istanbul ignore if */
    if (defaultRef !== ref || !configs.isConfigRepo(owner, repo)) {
      ctx.log.info(`Not config repo or ref. Skipping sync.`, {
        meta: { ref, repo, defaultRef, configRepo },
      })
      return
    }

    /* Load configuration */
    const configRaw = await gh.getFile(ctx.octokit, {
      owner,
      repo,
      ref,
      path: configs.LS_CONFIG_PATH,
    })

    /* Skip altogether if there's no configuration. */
    /* istanbul ignore next */
    if (configRaw === null) {
      ctx.log.info(`No configuration, skipping sync.`)
      return
    }

    const plan = await data.plan(owner)
    const [error, config] = configs.parse({ plan: plan, input: configRaw })

    /* Open an issue about invalid configuration. */
    if (error !== null) {
      ctx.log.info(`Error in config ${error}`, {
        meta: {
          config: JSON.stringify(config),
          error: error,
        },
      })

      const report = ml`
      | It seems like your configuration uses a format unknown to me. 
      | That might be a consequence of invalid yaml cofiguration file. 
      |
      | Here's what I am having problems with:
      |
      | ${error}
      `

      await ctx.octokit.repos.createCommitComment({
        owner,
        repo,
        commit_sha: ctx.payload.after,
        body: report,
      })

      ctx.log.info(`Commented on commit ${ctx.payload.after}.`)
      return
    }

    ctx.log.info(`Configuration loaded.`, {
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
        ctx.log.info(`Performing label sync on ${owner}.`)

        /* Performs sync. */

        const reports = await Promise.all(
          configs.configRepos(config!).map(async (repo) => {
            const repocfg = config!.repos.get(repo)!

            const result = await sync.sync(ctx.octokit, {
              owner,
              repo,
              config: repocfg,
            })

            if (!result.success) {
              ctx.log.error(result.message)
              return { repo: repo, config: repocfg.config, changes: null }
            }

            return { repo: repo, config: repocfg.config, changes: result.diff }
          }),
        )

        ctx.log.info(`Sync completed.`, {
          meta: {
            config: JSON.stringify(config),
            reports: JSON.stringify(reports),
          },
        })

        /* Comment on commit */

        await ctx.octokit.repos.createCommitComment({
          owner,
          repo,
          commit_sha: ctx.payload.after,
          body: language.generateReport(reports),
        })

        return
      }
      case 'Insufficient': {
        ctx.log.info(`Insufficient permissions: ${access.missing.join(', ')}`, {
          meta: {
            config: JSON.stringify(config),
            access: JSON.stringify(access),
          },
        })

        const report = ml`
        | Your configuration stretches beyond repositories I can access. 
        | Please update it so I may sync your labels.
        |
        | _Missing repositories:_
        | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
        `

        await ctx.octokit.repos.createCommitComment({
          owner,
          repo,
          commit_sha: ctx.payload.after,
          body: report,
        })

        ctx.log.info(`Commented on commit ${ctx.payload.after}.`)
        return
      }
    }
  })
}
