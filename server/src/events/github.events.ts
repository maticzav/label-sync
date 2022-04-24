import _ from 'lodash'
import ml from 'multilines'
import os from 'os'
import path from 'path'
import { Probot } from 'probot'

import {
  getLSConfigRepoName,
  LS_CONFIG_PATH,
  parseConfig,
  getPhysicalRepositories,
  isConfigRepo,
} from '@labelsync/config'

import { handleLabelSync } from '../handlers/labels'
import { generateHumanReadableCommitReport, generateHumanReadablePRReport } from '../language/labels'

import { populateTemplate } from '../lib/bootstrap'
import { getAccountConfiguration, getAccountInstallation, withContext } from '../lib/context'
import {
  addLabelsToIssue,
  bootstrapConfigRepository,
  checkInstallationAccess,
  createPRComment,
  getFile,
  getRepo,
  GHTree,
  GithubLabel,
  openIssue,
  removeLabelsFromRepository,
} from '../lib/github'
import { Sources } from '../lib/sources'
import { loadTreeFromPath, withDefault } from '../lib/utils'

const TEMPLATES = {
  yaml: path.resolve(__dirname, '../../../templates/yaml'),
  typescript: path.resolve(__dirname, '../../../templates/typescript'),
}

/**
 * Events associated with the Github App.
 */
export const github = (app: Probot, sources: Sources) => {
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
  app.on('installation.created', async (ctx) => {
    const account = ctx.payload.installation.account
    const owner = account.login.toLowerCase()
    const configRepo = getLSConfigRepoName(owner)

    /* Find installation. */

    const installation = sources.installations.upsert({
      account: owner,
      cadence: 'YEARLY',
      plan: 'FREE',
      activated: true,
    })

    app.log.info(`Onboarding ${owner}.`, {
      meta: {
        plan: installation.plan,
        periodEndsAt: installation.periodEndsAt,
      },
    })

    /* See if config repository exists. */
    const repo = await getRepo(ctx.octokit, owner, configRepo)

    switch (repo.status) {
      case 'Exists': {
        /* Perform sync. */

        app.log.info(`User has existing repository in ${configRepo}, performing sync.`)

        const ref = `refs/heads/${repo.repo.default_branch}`

        /* Load configuration */
        const rawConfig = await getFile(ctx.octokit, { owner, repo: configRepo, ref }, LS_CONFIG_PATH)

        /* No configuration, skip the evaluation. */
        /* istanbul ignore next */
        if (rawConfig === null) {
          app.log.info(`No configuration, skipping sync.`)
          return
        }

        const parsedConfig = parseConfig({
          input: rawConfig,
          isPro: installation.plan === 'PAID',
        })

        /* Wrong configuration, open the issue. */
        if (!parsedConfig.ok) {
          app.log.info(`Error in config, skipping sync.`, {
            meta: { config: rawConfig, error: parsedConfig.error },
          })

          /* Open an issue about invalid configuration. */
          const title = 'LabelSync - Onboarding configuration'
          const body = ml`
            | # Welcome to LabelSync!
            |
            | Hi there,
            | Thank you for using LabelSync. We hope you enjoyed the experience so far.
            | It seems like there are some problems with your configuration.
            | Our parser reported that:
            |
            | ${parsedConfig.error}
            |
            | Let us know if we can help you with the configuration by sending us an email to support@label-sync.com. 
            | We'll try to get back to you as quickly as possible.
            |
            | Best,
            | LabelSync Team
            `

          const issue = await openIssue(ctx.octokit, owner, configRepo, title, body)

          app.log.info(`Opened issue ${issue.number}.`)
          return
        }

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(ctx.octokit, getPhysicalRepositories(parsedConfig.config))

        switch (access.status) {
          case 'Sufficient': {
            app.log.info(`Performing sync.`)

            /* Performs sync. */
            for (const repo of getPhysicalRepositories(parsedConfig.config)) {
              await Promise.all([handleLabelSync(ctx.octokit, owner, repo, parsedConfig.config.repos[repo], true)])
            }

            return
          }
          case 'Insufficient': {
            app.log.info(`Insufficient permissions, skipping sync.`, {
              meta: { access: JSON.stringify(access) },
            })

            /* Opens up an issue about insufficient permissions. */
            const title = 'LabelSync - Insufficient permissions'
            const body = ml`
              | # Insufficient permissions
              |
              | Hi there,
              | Thank you for installing LabelSync. We have noticed that your configuration stretches beyond repositories we can access. 
              | We think you forgot to allow access to certain repositories. Please update your installation. 
              |
              | _Missing repositories:_
              | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
              |
              | Best,
              | LabelSync Team
              `

            const issue = await openIssue(ctx.octokit, owner, configRepo, title, body)

            app.log.info(`Opened issue ${issue.number}.`)
            return
          }
        }
      }

      case 'Unknown': {
        app.log.info(`No existing repository for ${owner}, start onboarding.`)

        /**
         * Bootstrap the configuration depending on the
         * type of the installation account.
         */
        const accountType = ctx.payload.installation.account.type
        switch (accountType) {
          /* istanbul ignore next */
          case 'User': {
            // TODO: Allow personal account scaffolding once Github provides support.
            app.log.info(`User account ${owner}, skip onboarding.`)
            return
          }
          case 'Organization': {
            /**
             * Tempalte using for onboarding new customers.
             */

            app.log.info(`Bootstraping config repo for ${owner}.`)

            const template: GHTree = loadTreeFromPath(TEMPLATES.yaml, [
              'dist',
              'node_modules',
              '.DS_Store',
              /.*\.log.*/,
              /.*\.lock.*/,
            ])

            /* Bootstrap a configuration repository in organisation. */
            const personalisedTemplate = populateTemplate(template, {
              repository: configRepo,
              repositories: ctx.payload.repositories ?? [],
            })

            await bootstrapConfigRepository(ctx.octokit, { owner, repo: configRepo }, personalisedTemplate)

            app.log.info(`Onboarding complete for ${owner}.`)

            return
          }
          /* istanbul ignore next */
          default: {
            app.log.warn(`Unsupported account type: ${accountType}`)
            return
          }
        }
      }
    }
  })

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
  app.on('push', (ctx) =>
    withContext({ ...ctx, sources }, async () => {
      const owner = ctx.payload.repository.owner.login.toLowerCase()
      const repo = ctx.payload.repository.name
      const ref = ctx.payload.ref
      const defaultRef = `refs/heads/${ctx.payload.repository.default_branch}`
      const commit_sha: string = ctx.payload.after

      const configRepo = getLSConfigRepoName(owner)

      /* Skip non default branch and other repos pushes. */
      /* istanbul ignore if */
      if (defaultRef !== ref || !isConfigRepo(owner, repo)) {
        app.log.info(`Not config repo or ref. Skipping sync.`, {
          meta: {
            ref,
            repo,
            defaultRef,
            configRepo,
          },
        })
        return
      }

      /* Load configuration */
      const rawConfig = await getFile(ctx.octokit, { owner, repo, ref }, LS_CONFIG_PATH)

      /* Skip altogether if there's no configuration. */
      /* istanbul ignore next */
      if (rawConfig === null) {
        app.log.info(`No configuration, skipping sync.`)
        return
      }

      const installation = await getAccountInstallation({ ...ctx, sources })

      const parsedConfig = parseConfig({
        input: rawConfig,
        isPro: installation.plan === 'PAID',
      })

      /* Open an issue about invalid configuration. */
      if (!parsedConfig.ok) {
        app.log.info(`Error in config ${parsedConfig.error}`)

        const report = ml`
            | It seems like your configuration uses a format unknown to me. 
            | That might be a consequence of invalid yaml cofiguration file. 
            |
            | Here's what I am having problems with:
            |
            | ${parsedConfig.error}
            `

        await ctx.octokit.repos.createCommitComment({
          owner,
          repo,
          commit_sha,
          body: report,
        })

        app.log.info(`Commented on commit ${commit_sha}.`)
        return
      }

      app.log.info(`Configuration loaded.`, {
        meta: {
          config: JSON.stringify(parsedConfig.config),
        },
      })

      /* Verify that we can access all configured files. */
      const access = await checkInstallationAccess(ctx.octokit, getPhysicalRepositories(parsedConfig.config))

      /* Skip configurations that we can't access. */
      switch (access.status) {
        case 'Sufficient': {
          app.log.info(`Performing label sync on ${owner}.`)

          /* Performs sync. */

          const reports = await Promise.all(
            getPhysicalRepositories(parsedConfig.config).map((repo) =>
              handleLabelSync(ctx.octokit, owner, repo, parsedConfig.config.repos[repo], true),
            ),
          )

          app.log.info(`Sync completed.`, {
            meta: {
              config: JSON.stringify(parsedConfig.config),
              reports: JSON.stringify(reports),
            },
          })

          /* Comment on commit */

          const report = generateHumanReadableCommitReport(reports)
          const commit_sha: string = ctx.payload.after

          await ctx.octokit.repos.createCommitComment({
            owner,
            repo,
            commit_sha,
            body: report,
          })

          return
        }
        case 'Insufficient': {
          app.log.info(`Insufficient permissions: ${access.missing.join(', ')}`, {
            meta: {
              config: JSON.stringify(parsedConfig.config),
              access: JSON.stringify(access),
            },
          })

          const commit_sha: string = ctx.payload.after
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
            commit_sha,
            body: report,
          })

          app.log.info(`Commented on commit ${commit_sha}.`)
          return
        }
      }
    }),
  )

  /**
   * Pull Request event
   *
   * Tasks:
   *  - review changes introduced,
   *  - open issues,
   *  - review changes.
   */
  app.on('pull_request', (ctx) =>
    withContext({ ...ctx, sources }, async () => {
      const owner = ctx.payload.repository.owner.login.toLowerCase()
      const repo = ctx.payload.repository.name
      const ref = ctx.payload.pull_request.head.ref
      const number = ctx.payload.pull_request.number

      const configRepo = getLSConfigRepoName(owner)

      app.log.info(`PullRequest action: ${ctx.payload.action}`)

      /* istanbul ignore if */
      if (!isConfigRepo(owner, repo)) {
        app.log.info(`Not configuration repository, skipping pull request overview.`, {
          meta: { configurationRepo: configRepo, currentRepo: repo },
        })
        return
      }

      const installation = await getAccountInstallation({ ...ctx, sources })

      // Check changed files.
      const compare = await ctx.octokit.repos.compareCommits({
        owner: owner,
        repo: repo,
        base: ctx.payload.pull_request.base.ref,
        head: ctx.payload.pull_request.head.ref,
      })

      /* istanbul ignore next */
      if (compare.data.files?.every((file) => file.filename !== LS_CONFIG_PATH)) {
        app.log.info(`Configuration didn't change, skipping comment.`, {
          meta: { files: compare.data.files.map((file) => file.filename).join(', ') },
        })
        return
      }

      // Start the process of PR review.
      switch (ctx.payload.action) {
        case 'opened':
        case 'reopened':
        case 'ready_for_review':
        case 'review_requested':
        case 'synchronize':
        case 'edited': {
          /* Review pull request. */

          const startedAt = new Date()

          /* Start a Github check. */
          const check = await ctx.octokit.checks
            .create({
              name: 'label-sync/dryrun',
              owner: owner,
              repo: repo,
              head_sha: ctx.payload.pull_request.head.sha,
              started_at: startedAt.toISOString(),
              status: 'in_progress',
            })
            .then((res) => res.data)

          /* Load configuration */
          const rawConfig = await getFile(ctx.octokit, { owner, repo, ref }, LS_CONFIG_PATH)

          /* Skip the pull request if there's no configuraiton. */
          /* istanbul ignore next */
          if (rawConfig === null) {
            app.log.info(`No configuration, skipping comment.`)
            return
          }

          const parsedConfig = parseConfig({
            input: rawConfig,
            isPro: installation.plan === 'PAID',
          })

          /* Skips invalid configuration. */
          /* istanbul ignore if */
          if (!parsedConfig.ok) {
            app.log.info(`Invalid configuration on ${ref}`, {
              meta: {
                config: rawConfig,
                error: parsedConfig.error,
              },
            })

            const report = ml`
                | Your configuration seems a bit strange. Here's what I am having problems with:
                |
                | ${parsedConfig.error}
                `

            const completedAt = new Date()

            /* Complete a Github check. */
            const completedCheck = await ctx.octokit.checks
              .update({
                check_run_id: check.id,
                owner: owner,
                repo: repo,
                status: 'completed',
                completed_at: completedAt.toISOString(),
                conclusion: 'failure',
                output: {
                  title: 'Invalid configuration',
                  summary: report,
                },
              })
              .then((res) => res.data)

            app.log.info(`Submited a check failure (${completedCheck.id})`)
            return
          }

          app.log.info(`Configration loaded configuration on ${ref}`, {
            meta: { config: rawConfig },
          })

          /* Verify that we can access all configured files. */
          const access = await checkInstallationAccess(ctx.octokit, getPhysicalRepositories(parsedConfig.config))

          /* Skip configurations that we can't access. */
          switch (access.status) {
            case 'Sufficient': {
              app.log.info(`Simulating sync.`)

              /* Fetch changes to repositories. */
              const reports = await Promise.all(
                getPhysicalRepositories(parsedConfig.config).map((repo) =>
                  handleLabelSync(ctx.octokit, owner, repo, parsedConfig.config.repos[repo], false),
                ),
              )

              /* Comment on pull request. */

              const report = generateHumanReadablePRReport(reports)
              const successful = reports.every((report) => report.status === 'Success')

              /* Comment on a PR in a human friendly way. */
              const comment = await createPRComment(ctx.octokit, owner, configRepo, number, report)

              app.log.info(`Commented on PullRequest (${comment.id})`)

              const completedAt = new Date()

              /* Complete a Github check. */
              const completedCheck = await ctx.octokit.checks
                .update({
                  check_run_id: check.id,
                  owner: owner,
                  repo: repo,
                  status: 'completed',
                  completed_at: completedAt.toISOString(),
                  conclusion: successful ? 'success' : 'failure',
                })
                .then((res) => res.data)

              app.log.info(`Check updated (${completedCheck.id}) (#${number}) ${completedCheck.status}`)

              return
            }
            case 'Insufficient': {
              app.log.info(`Insufficient permissions`)

              /* Opens up an issue about insufficient permissions. */
              const body = ml`
                  | It seems like this configuration stretches beyond repositories we can access. 
                  | Please update it so we can help you as best as we can.
                  |
                  | _Missing repositories:_
                  | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
                  `

              /* Complete a check run */

              const completedAt = new Date()

              const completedCheck = await ctx.octokit.checks
                .update({
                  check_run_id: check.id,
                  owner: owner,
                  repo: repo,
                  status: 'completed',
                  completed_at: completedAt.toISOString(),
                  conclusion: 'failure',
                  output: {
                    title: 'Missing repository access.',
                    summary: body,
                  },
                })
                .then((res) => res.data)

              app.log.info(`Completed check ${completedCheck.id}`)

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
        case 'review_request_removed':
        /* istanbul ignore next */
        case 'unassigned':
        /* istanbul ignore next */
        case 'unlabeled':
        /* istanbul ignore next */
        case 'unlocked': {
          /* Ignore other events. */
          app.log.info(`Ignoring event ${ctx.payload.action}.`)
          return
        }
        /* istanbul ignore next */
        default: {
          /* Log unsupported pull_request action. */
          /* prettier-ignore */
          app.log.warn(`Unhandled PullRequest action: ${ctx.payload.action}`)
          return
        }
      }
    }),
  )

  /**
   * Label Created
   *
   * Tasks:
   *  - figure out whether repository is strict
   *  - prune unsupported labels.
   */
  app.on('label.created', (ctx) =>
    withContext({ ...ctx, sources }, async () => {
      const owner = ctx.payload.repository.owner.login.toLowerCase()
      const repo = ctx.payload.repository.name.toLowerCase()

      const configuration = await getAccountConfiguration({ ...ctx, sources })
      const config = configuration.repos[repo] || configuration.repos['*']

      const label = ctx.payload.label as GithubLabel

      app.log.info(`New label create in ${repo}: "${label.name}".`)

      /* Ignore no configuration. */
      /* istanbul ignore if */
      if (!config) {
        app.log.info(`No configuration, skipping`)
        return
      }

      /* Ignore complying changes. */
      /* istanbul ignore if */
      if (config.labels.hasOwnProperty(label.name)) {
        app.log.info(`Label is configured, skipping removal.`)
        return
      }

      /* Config */
      const removeUnconfiguredLabels = withDefault(false, config.config?.removeUnconfiguredLabels)

      if (removeUnconfiguredLabels) {
        app.log.info(`Removing "${label.name}" from ${repo}.`)

        /* Prune unsupported labels in strict repositories. */
        await removeLabelsFromRepository(ctx.octokit, { repo, owner }, [label], removeUnconfiguredLabels)

        app.log.info(`Removed label "${label.name}" from ${repo}.`)
      }
    }),
  )

  /**
   * Label assigned to issue
   *
   * Tasks:
   *  - check if there are any siblings that we should add
   *  - add siblings
   */
  app.on('issues.labeled', (ctx) =>
    withContext({ ...ctx, sources }, async () => {
      const owner = ctx.payload.repository.owner.login.toLowerCase()
      const repo = ctx.payload.repository.name.toLowerCase()

      const configuration = await getAccountConfiguration({ ...ctx, sources })
      const config = configuration.repos[repo]

      const label = (ctx.payload as any as { label: GithubLabel }).label
      const issue = ctx.payload.issue

      app.log.debug('IssueLabeled payload and config', {
        payload: ctx.payload,
        config: config,
      })

      app.log.info(`Issue (${issue.number}) labeled with "${label.name}".`)

      /* Ignore changes in non-strict config */
      /* istanbul ignore if */
      if (!config) {
        app.log.info(`No configuration found, skipping.`)
        return
      }

      /* istanbul ignore if */
      if (!config.labels.hasOwnProperty(label.name)) {
        app.log.info(`Unconfigured label "${label.name}", skipping.`)
        return
      }

      /* Find siblings. */
      const siblings = _.get(config, ['labels', label.name, 'siblings'], [] as string[])
      const ghSiblings = siblings.map((sibling) => ({ name: sibling }))

      /* istanbul ignore if */
      if (ghSiblings.length === 0) {
        app.log.info(`No siblings to add to "${label.name}", skipping.`)
        return
      }

      await addLabelsToIssue(ctx.octokit, { repo, owner, issue: issue.number }, ghSiblings, true)

      /* prettier-ignore */
      app.log.info(`Added siblings of ${label.name} to issue ${issue.number}: ${siblings.join(', ')}`)
    }),
  )

  /**
   * Label assigned to pull_request
   *
   * Tasks:
   *  - check if there are any siblings that we should add
   *  - add siblings
   */
  app.on('pull_request.labeled', (ctx) =>
    withContext({ ...ctx, sources }, async () => {
      const owner = ctx.payload.repository.owner.login.toLowerCase()
      const repo = ctx.payload.repository.name.toLowerCase()

      const configuration = await getAccountConfiguration({ ...ctx, sources })
      const config = configuration.repos[repo]

      const label = ctx.payload.label
      const issue = ctx.payload.pull_request

      app.log.debug('PullRequestLabeled payload and config', {
        payload: ctx.payload,
        config,
      })

      app.log.info(`PullRequest (${issue.number}) labeled with "${label.name}".`)

      /* Ignore changes in non-strict config */
      /* istanbul ignore if */
      if (!config) {
        app.log.info(`No configuration found, skipping.`)
        return
      }

      /* istanbul ignore if */
      if (!config.labels.hasOwnProperty(label.name)) {
        app.log.info(`Unconfigured label "${label.name}", skipping.`)
        return
      }

      /* Find siblings. */
      const siblings = _.get(config, ['labels', label.name, 'siblings'], [] as string[])
      const ghSiblings = siblings.map((sibling) => ({ name: sibling }))

      /* istanbul ignore if */
      if (ghSiblings.length === 0) {
        app.log.info(`No siblings to add to "${label.name}", skipping.`)
        return
      }

      await addLabelsToIssue(ctx.octokit, { repo, owner, issue: issue.number }, ghSiblings, true)

      /* prettier-ignore */
      app.log.info(`Added siblings of ${label.name} to pr ${issue.number}: ${siblings.join(', ')}`)
    }),
  )

  /**
   * New repository created
   *
   * Tasks:
   *  - check if there's a wildcard configuration
   *  - sync labels on that repository
   */
  app.on('repository.created', (ctx) =>
    withContext({ ...ctx, sources }, async () => {
      const owner = ctx.payload.repository.owner.login.toLowerCase()
      const repo = ctx.payload.repository.name.toLowerCase()

      const configuration = await getAccountConfiguration({ ...ctx, sources })
      const config = configuration.repos[repo] || configuration.repos['*']

      app.log.info(`New repository ${repo} in ${owner}.`)

      /* Ignore no configuration. */
      /* istanbul ignore if */
      if (!config) {
        app.log.info(`No configuration, skipping sync.`)
        return
      }

      app.log.info(`Performing sync on ${repo}.`)
      await handleLabelSync(ctx.octokit, owner, repo, config, true)
      app.log.info(`Repository synced ${repo}.`)
    }),
  )
}
