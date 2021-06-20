/**
 * This file contains code associated with app installation process.
 */

import * as path from 'path'
import ml from 'multilines'
import os from 'os'

import * as templates from '../templates'
import * as configs from '../config'
import * as gh from '../github'
import * as language from '../language'
import { sync } from '../handlers/sync'

import { loadTreeFromPath } from '../utils'
import { Handler } from '../event'

// MARK: - Constants

const TEMPLATES = {
  yaml: path.resolve(__dirname, '../../templates/yaml'),
  typescript: path.resolve(__dirname, '../../templates/typescript'),
}

// MARK: - Event

export const handler: Handler = (on, { data }) => {
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
  on('installation.created', async (ctx) => {
    const account = ctx.payload.installation.account
    const owner = account.login.toLowerCase()
    const configRepo = configs.getLSConfigRepoName(owner)

    ctx.log.info(`Onboarding ${owner}.`)

    // Onboarding

    const repo = await gh.getRepo(ctx.octokit, {
      owner,
      repo: configRepo,
    })

    /**
     * We try to perform a sync if the repository exists already or
     * onboard the new user if it doesn't exist yet.
     */

    switch (repo.status) {
      case 'Exists': {
        /* Perform sync. */

        ctx.log.info(`Existing repository in ${configRepo}, syncing...`)

        /* Load configuration */
        const configRaw = await gh.getFile(ctx.octokit, {
          owner,
          repo: configRepo,
          ref: `refs/heads/${repo.repo.default_branch}`,
          path: configs.LS_CONFIG_PATH,
        })

        /* istanbul ignore next */
        if (configRaw === null) {
          ctx.log.info(`No configuration, skipping sync.`)
          return
        }

        /**
         * We try to parse the configuration and check if is valid.
         */
        const plan = await data.plan(owner)
        const [error, config] = configs.parse({ plan: plan, input: configRaw })

        /* Wrong configuration, open the issue. */
        if (error !== null) {
          ctx.log.info(`Error in config, opening issue.`, {
            meta: {
              config: JSON.stringify(config),
              error: error,
            },
          })

          /* Open an issue about invalid configuration. */
          const title = 'LabelSync - Onboarding configuration'
          const body = ml`
          | # Welcome to LabelSync!
          |
          | Hi there :wave:,
          | Thank you for using LabelSync. We hope you enjoyed the experience so far.
          | It seems like there are some problems with your configuration.
          | Our parser reported that:
          |
          | ${error}
          |
          | Let us know if we can help you with the configuration by sending us an email to support@label-sync.com. We'll try to get back to you as quickly as possible.
          |
          | Best,
          | LabelSync Team
          `

          const issue = await gh.openIssue(ctx.octokit, {
            owner,
            repo: configRepo,
            title,
            body,
          })

          ctx.log.info(`Opened issue ${issue.number}.`)
          return
        }

        /* Verify that we can access all configured files. */
        const access = await gh.checkInstallationAccess(ctx.octokit, {
          repos: configs.configRepos(config!),
        })

        switch (access.status) {
          case 'Sufficient': {
            ctx.log.info(`Sufficient access, performing sync.`)

            // Perform the sync.
            const reports = await Promise.all(
              configs.configRepos(config!).map(async (repo) => {
                const repocfg = config?.repos.get(repo)!

                const result = await sync(ctx.octokit, {
                  owner: owner,
                  repo: repo,
                  config: repocfg,
                })

                if (!result.success) {
                  return { repo, config: repocfg.config, changes: null }
                }

                return { repo, config: repocfg.config, changes: result.diff }
              }),
            )

            const report = language.generateReport(reports)
            const sha = await gh.getLatestRepositoryCommitSHA(ctx.octokit, {
              owner: owner,
              repo: configRepo,
            })

            await ctx.octokit.repos.createCommitComment({
              owner,
              repo: configRepo,
              commit_sha: sha!,
              body: report,
            })

            return
          }

          case 'Insufficient': {
            ctx.log.info(`Insufficient access, skipping sync.`, {
              meta: { access: JSON.stringify(access) },
            })

            /* Opens up an issue about insufficient permissions. */
            const title = 'LabelSync - Insufficient permissions'
            const body = ml`
            | # Insufficient permissions
            |
            | Hi there,
            | Thank you for installing LabelSync. We have noticed that your configuration stretches beyond repositories we can access. We assume that you forgot to allow access to certain repositories.
            |
            | Please update your installation. 
            |
            | _Missing repositories:_
            | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
            |
            | Best,
            | LabelSync Team
            `

            const issue = await gh.openIssue(ctx.octokit, {
              owner,
              repo: configRepo,
              title,
              body,
            })

            ctx.log.info(`Opened issue ${issue.number}.`)
            return
          }
        }
      }

      case 'Unknown': {
        ctx.log.info(`No existing repository for ${owner}, start onboarding.`)

        /**
         * Bootstrap the configuration depending on the
         * type of the installation account.
         */
        const accountType = ctx.payload.installation.account.type
        switch (accountType) {
          /* istanbul ignore next */
          case 'User': {
            // TODO: Update once Github changes the settings
            ctx.log.info(`User account ${owner}, skip onboarding.`)
            return
          }
          case 'Organization': {
            /**
             * Tempalte using for onboarding new customers.
             */

            ctx.log.info(`Bootstraping config repo for ${owner}.`)

            const template: gh.GHTree = loadTreeFromPath(TEMPLATES.yaml, [
              'dist',
              'node_modules',
              '.DS_Store',
              /.*\.log.*/,
              /.*\.lock.*/,
            ])

            /* Bootstrap a configuration repository in organisation. */
            const personalisedTemplate = templates.populate(template, {
              repository: configRepo,
              repositories: ctx.payload.repositories,
            })

            await gh.bootstrapConfigRepository(ctx.octokit, {
              owner,
              repo: configRepo,
              tree: personalisedTemplate,
            })

            ctx.log.info(`Onboarding complete for ${owner}.`)

            return
          }
          /* istanbul ignore next */
          default: {
            ctx.log.warn(`Unsupported account type: ${accountType}`)
            return
          }
        }
      }
    }
  })

  //
}
