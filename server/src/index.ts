import Webhooks = require('@octokit/webhooks')
import fs from 'fs'
import ml from 'multilines'
import os from 'os'
import path from 'path'
import { Application, Context } from 'probot'

import {
  parseConfig,
  LSCConfiguration,
  LS_CONFIG_PATH,
  getLSConfigRepoName,
} from './configuration'
import {
  checkInstallationAccess,
  getFile,
  openIssue,
  createPRComment,
  removeLabelsFromRepository,
  getRepo,
  bootstrapConfigRepository,
  GHTree,
  addLabelsToIssue,
  GithubLabel,
} from './github'
import { handleLabelSync } from './handlers/labels'
import { generateHumanReadableReport } from './language/labels'
import { loadTreeFromPath, withDefault } from './utils'
import { populateTempalte } from './bootstrap'

/**
 * Tempalte using for onboarding new customers.
 */
const BOOTSTRAP_TEMPLATE_PATH = path.resolve(__dirname, '../../templates/yaml')
const BOOTSTRAP_REPOSITORY: GHTree = loadTreeFromPath(BOOTSTRAP_TEMPLATE_PATH, [
  'dist',
  'node_modules',
  '.DS_Store',
  /.*\.log.*/,
  /.*\.lock.*/,
])

/* Application */

module.exports = (app: Application) => {
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
  app.on('installation.created', async ({ github, log, payload }) => {
    const owner = payload.installation.account.login
    const configRepo = getLSConfigRepoName(owner)

    log.info(`Onboarding ${owner} with ${configRepo}`)

    /* See if config repository exists. */
    const repo = await getRepo(github, owner, configRepo)

    switch (repo.status) {
      case 'Exists': {
        /* Perform sync. */

        const ref = `refs/heads/${repo.repo.default_branch}`

        /* Load configuration */
        const configRaw = await getFile(
          github,
          { owner, repo: configRepo, ref },
          LS_CONFIG_PATH,
        )

        /* No configuration, skip the evaluation. */
        /* istanbul ignore next */
        if (configRaw === null) {
          return
        }

        const [error, config] = parseConfig(configRaw)

        log.debug({ config }, `Loaded configuration for ${owner}.`)

        /* Wrong configuration, open the issue. */
        if (error !== null) {
          log.debug(`Error in ${owner} configuration: ${error}`)

          /* Open an issue about invalid configuration. */
          const title = 'LabelSync - Invalid configuration'
          const body = ml`
          | # Invalid configuration
          |
          | Hi there,
          | Thank you for using LabelSync. It seems like there are some problems with your
          | configuration. Here's what our parser reported:
          |
          | \`\`\`
          | ${error}
          | \`\`\`
          |
          | Best,
          | LabelSync Team
          `

          await openIssue(github, owner, configRepo, title, body)

          return
        }

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(
          github,
          Object.keys(config!.repos),
        )

        switch (access.status) {
          case 'Sufficient': {
            /* Performs sync. */
            for (const repo in config!.repos) {
              await Promise.all([
                handleLabelSync(github, owner, repo, config!.repos[repo], true),
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
            | Thank you for installing LabelSync. We have noticed that your 
            | configuration stretches beyond repositories we can access. We assume that you
            | forgot to allow access to certain repositories.
            | Please update your installation. 
            |
            | _Missing repositories:_
            | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
            |
            | Best,
            | LabelSync Team
            `

            await openIssue(github, owner, configRepo, title, body)

            return
          }
        }
      }

      case 'Unknown': {
        /* Bootstrap a configuration repository. */
        const template = populateTempalte(BOOTSTRAP_REPOSITORY, {
          repository: configRepo,
          repositories: payload.repositories,
        })

        await bootstrapConfigRepository(
          github,
          { owner, repo: configRepo },
          template,
        )
        return
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
  app.on('push', async ({ payload, github, log }) => {
    const owner = payload.repository.owner.login
    const repo = payload.repository.name
    const ref = payload.ref
    const defaultRef = `refs/heads/${payload.repository.default_branch}`

    const configRepo = getLSConfigRepoName(owner)

    /* Skip non default branch and other repos pushes. */
    /* istanbul ignore if */
    if (defaultRef !== ref || configRepo !== repo) {
      log.debug({ defaultRef, ref, configRepo, repo }, `Skipping sync ${owner}`)
      return
    }

    /* Load configuration */
    const configRaw = await getFile(
      github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )

    /* Skip altogether if there's no configuration. */
    /* istanbul ignore next */
    if (configRaw === null) {
      return
    }

    const [error, config] = parseConfig(configRaw)

    log.debug({ config }, `Loaded configuration for ${owner}.`)

    /* Open an issue about invalid configuration. */
    if (error !== null) {
      log.debug(`Error in ${owner} configuration: ${error}`)

      const title = 'LabelSync - Invalid configuration'
      const body = ml`
      | # Invalid configuration
      |
      | Hi there,
      | Thank you for using LabelSync. It seems like your configuration
      | uses a format unknown to us. That might be a consequence of invalid yaml 
      | cofiguration file. 
      |
      | \`\`\`
      | ${error}
      | \`\`\`
      |
      | Best,
      | LabelSync Team
      `

      await openIssue(github, owner, configRepo, title, body)

      return
    }

    /* Verify that we can access all configured files. */
    const access = await checkInstallationAccess(
      github,
      Object.keys(config!.repos),
    )

    /* Skip configurations that we can't access. */
    switch (access.status) {
      case 'Sufficient': {
        /* Performs sync. */
        for (const repo in config!.repos) {
          await Promise.all([
            handleLabelSync(github, owner, repo, config!.repos[repo], true),
          ])
        }

        /* Closes issues */

        // TODO: close issues on successful sync.

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
        | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
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

    log.debug(
      { configRepo, repo },
      `${owner}: received pr event ${payload.action}`,
    )

    /* istanbul ignore if */
    if (configRepo !== repo) return

    /* Check changed files */
    const compare = await github.repos.compareCommits({
      owner: owner,
      repo: repo,
      base: payload.pull_request.base.ref,
      head: payload.pull_request.head.ref,
    })

    /* istanbul ignore next */
    if (compare.data.files.every((file) => file.filename !== LS_CONFIG_PATH)) {
      log.debug(
        { files: compare.data.files },
        `Skipping merge comment, configuration didn't change.`,
      )
      return
    }

    /* Load configuration */
    const configRaw = await getFile(
      github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )

    /* Skip the pull request if there's no configuraiton. */
    /* istanbul ignore next */
    if (configRaw === null) {
      return
    }

    const [error, config] = parseConfig(configRaw)

    log.debug({ config }, `Loaded configuration for ${owner}/${ref}.`)

    /* Skips invalid configuration. */
    /* istanbul ignore if */
    if (error !== null) return

    switch (payload.action) {
      case 'opened':
      case 'review_requested':
      case 'edited': {
        /* Review pull request. */

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(
          github,
          Object.keys(config!.repos),
        )

        /* Skip configurations that we can't access. */
        switch (access.status) {
          case 'Sufficient': {
            /* Fetch changes to repositories. */
            const reports = await Promise.all(
              Object.keys(config!.repos).map((repo) =>
                handleLabelSync(
                  github,
                  owner,
                  repo,
                  config!.repos[repo],
                  false,
                ),
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
            | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
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
        log.error(
          `${owner}:${repo} unsupported pull_request event: ${payload.action}`,
        )

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
    withSources(async (ctx) => {
      const owner = ctx.payload.sender.login
      const repo = ctx.payload.repository.name
      const config = ctx.sources.config.repos[repo]
      const label = ctx.payload.label

      /* Ignore no configuration. */
      /* istanbul ignore if */
      if (!config) return

      /* Ignore complying changes. */
      /* istanbul ignore if */
      if (config.labels.hasOwnProperty(label.name)) return

      /* Config */
      const removeUnconfiguredLabels = withDefault(
        false,
        config.config?.removeUnconfiguredLabels,
      )

      /* Prune unsupported labels in strict repositories. */
      await removeLabelsFromRepository(
        ctx.github,
        { repo, owner },
        [label],
        removeUnconfiguredLabels,
      )
    }),
  )

  /**
   * Label assigned to issue
   *
   * Tasks:
   *  - check if there are any siblings that we should add
   *  - add siblings
   */
  app.on(
    'issues.labeled',
    withSources(async (ctx) => {
      const owner = ctx.payload.sender.login
      const repo = ctx.payload.repository.name
      const config = ctx.sources.config.repos[repo]
      const label = ((ctx.payload as any) as { label: GithubLabel }).label
      const issue = ctx.payload.issue

      /* Ignore changes in non-strict config */
      /* istanbul ignore if */
      if (!config || !config.labels.hasOwnProperty(label.name)) return

      /* Find siblings. */
      const siblings = withDefault([], config.labels[label.name]?.siblings)
      const ghSiblings = siblings.map((sibling) => ({ name: sibling }))

      ctx.log.debug(
        { ghSiblings },
        `${owner}:${repo}:#${issue.number} adding siblings to ${label.name}`,
      )

      await addLabelsToIssue(
        ctx.github,
        { repo, owner, issue: issue.number },
        ghSiblings,
        true,
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
  return async (ctx) => {
    const owner = ctx.payload.sender.login
    const repo = getLSConfigRepoName(owner)
    const ref = `refs/heads/${ctx.payload.repository.default_branch}`

    /* Load configuration */
    const configRaw = await getFile(
      ctx.github,
      { owner, repo, ref },
      LS_CONFIG_PATH,
    )

    /* Skip if there's no configuration. */
    /* istanbul ignore next */
    if (configRaw === null) return

    const [error, config] = parseConfig(configRaw)

    /* Skips invlaid config. */
    /* istanbul ignore if */
    if (error !== null) return
    ;(ctx as Context<C> & { sources: Sources }).sources = { config: config! }

    return fn(ctx as Context<C> & { sources: Sources })
  }
}
