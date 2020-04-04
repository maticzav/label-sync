import Webhooks = require('@octokit/webhooks')
import { PrismaClient, Purchase } from '@prisma/client'
import bodyParser from 'body-parser'
import ml from 'multilines'
import os from 'os'
import path from 'path'
import { Application, Context } from 'probot'

import { populateTempalte } from './bootstrap'
import {
  getLSConfigRepoName,
  LSCConfiguration,
  LS_CONFIG_PATH,
  parseConfig,
} from './configuration'
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
} from './github'
import { handleLabelSync } from './handlers/labels'
import { generateHumanReadableReport } from './language/labels'
import { Logger } from './logger'
import { loadTreeFromPath, withDefault } from './utils'
import { Payments } from './payment'

/* Templates */

const TEMPLATES = {
  yaml: path.resolve(__dirname, '../../templates/yaml'),
  typescript: path.resolve(__dirname, '../../templates/typescript'),
}

/* Application */

module.exports = (
  app: Application,
  prisma: PrismaClient = new PrismaClient(),
) => {
  app.log(`LabelSync manager up and running! 🚀`)

  const logger = new Logger(prisma)
  const payments = new Payments(
    process.env.STRIPE_API_KEY!,
    process.env.STRIPE_ENDPOINT_SECRET!,
  )

  /* API */

  const api = app.route('/subscribe')

  api.use(bodyParser.json())

  api.post('/session', async (req, res) => {
    try {
      const owner = req.body.owner
      if (!owner) {
        res.sendStatus(400)
      }

      const session = await payments.getSession(owner)
      return res.status(200).send(session.id)
    } catch (err) {
      return res.sendStatus(500)
    }
  })

  /* Stripe */

  const router = app.route('/stripe')

  router.post(
    '/',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res) => {
      let event

      try {
        event = await payments.constructEvent(
          req.body,
          req.headers['stripe-signature'] as string,
        )
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`)
      }

      /* Event handlers */
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as {
            metadata: { owner: string }
            customer: { email: string }
          }
          const email = session.customer.email
          const owner = session.metadata.owner

          await prisma.purchase.create({
            data: {
              owner,
              plan: 'stripe-basic',
              planId: 42,
              email,
              tier: 'BASIC',
              type: 'ORGANIZATION',
              trial: false,
            },
          })

          break
        }
        default: {
          return res.status(400).end()
        }
      }

      return res.json({ received: true })
    },
  )

  /* Github. */

  /**
   * Marketplace purchase event
   *
   * Tasks:
   *  - reference the purchase in the database.
   */
  app.on('marketplace_purchase.purchased', async (ctx) => {
    const purchase = ctx.payload.marketplace_purchase
    const owner = purchase.account

    // TODO: Add tier appropreately.
    const tier = ctx.payload.marketplace_purchase.plan.unit_name

    try {
      const dbpurchase = await prisma.purchase.create({
        data: {
          owner: owner.login,
          email: owner.organization_billing_email,
          plan: purchase.plan.name,
          planId: purchase.plan.id,
          tier: 'BASIC',
          type: owner.type === 'User' ? 'USER' : 'ORGANIZATION',
        },
      })

      await logger.info(
        { owner: owner.login, event: 'marketplace_purchase.purchased' },
        `${owner.login}: ${owner.type} purchased LabelSync plan ${dbpurchase.planId}`,
      )
    } catch (err) /* istanbul ignore next */ {
      await logger.debug(
        { owner: owner.login, event: 'marketplace_purchase.purchased' },
        err,
        `couldn't process a marketplace purchase`,
      )
    }
  })

  /**
   * Marketplace purchase event
   *
   * Tasks:
   *  - reference the purchase in the database.
   */
  app.on('marketplace_purchase.cancelled', async (ctx) => {
    const purchase = ctx.payload.marketplace_purchase
    const owner = purchase.account

    try {
      const dbpurchase = await prisma.purchase.delete({
        where: {
          owner: owner.login,
        },
      })

      await logger.info(
        { owner: owner.login, event: 'marketplace_purchase.cancelled' },
        `${owner.login} cancelled LabelSync plan ${dbpurchase.planId}`,
      )
    } catch (err) /* istanbul ignore next */ {
      await logger.debug(
        { owner: owner.login, event: 'marketplace_purchase.cancelled' },
        err,
        `couldn't process a marketplace cancellation`,
      )
    }
  })

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
    try {
      const configRepo = getLSConfigRepoName(owner)

      const purchase = await prisma.purchase.findOne({ where: { owner } })

      await logger.info(
        { owner, event: 'installation.created' },
        `onboarding ${configRepo}, purchased tier: ${purchase?.tier}`,
      )

      /* See if config repository exists. */
      const repo = await getRepo(github, owner, configRepo)

      switch (repo.status) {
        case 'Exists': {
          /* Perform sync. */

          await logger.info(
            { owner, event: 'installation.created' },
            `user has existing repository in ${configRepo}`,
          )

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
            await logger.info(
              { owner, event: 'installation.created' },
              `no configuration`,
            )
            return
          }

          const [error, config] = parseConfig(purchase, configRaw)

          /* Wrong configuration, open the issue. */
          if (error !== null) {
            await logger.debug(
              { owner, event: 'installation.created' },
              { config },
              `error in config ${error}`,
            )

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
          | \`\`\`
          | ${error}
          | \`\`\`
          |
          | Let us know if we can help you with the configuration by sending us an email to support@label-sync.com. We'll try to get back to you as quickly as possible.
          |
          | Best,
          | LabelSync Team
          `

            const issue = await openIssue(
              github,
              owner,
              configRepo,
              title,
              body,
            )

            await logger.info(
              { owner, event: 'installation.created' },
              `opened error issue ${issue.number}`,
            )

            return
          }

          /* Verify that we can access all configured files. */
          const access = await checkInstallationAccess(
            github,
            Object.keys(config!.repos),
          )

          await logger.debug(
            { owner, event: 'installation.created' },
            { access },
            `obtained access status`,
          )

          switch (access.status) {
            case 'Sufficient': {
              await logger.info(
                { owner, event: 'installation.created' },
                `syncing labels`,
              )

              /* Performs sync. */
              for (const repo in config!.repos) {
                await Promise.all([
                  handleLabelSync(
                    github,
                    owner,
                    repo,
                    config!.repos[repo],
                    true,
                  ),
                ])
              }

              return
            }
            case 'Insufficient': {
              await logger.info(
                { owner, event: 'installation.created' },
                `insufficient permissions ${access}`,
              )

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

              const issue = await openIssue(
                github,
                owner,
                configRepo,
                title,
                body,
              )

              await logger.info(
                { owner, event: 'installation.created' },
                `opened issue ${issue.number} for insufficient persmissions`,
              )

              return
            }
          }
        }

        case 'Unknown': {
          await logger.info(
            { owner, event: 'installation.created' },
            `no existing repository for ${owner}`,
          )

          /**
           * Bootstrap the configuration depending on the
           * type of the installation account.
           */
          switch (payload.installation.account.type) {
            /* istanbul ignore next */
            case 'User': {
              // TODO: Update once Github changes the settings
              await logger.info(
                { owner, event: 'installation.created' },
                `skip bootstrap for User accounts`,
              )
              return
            }
            case 'Organization': {
              /**
               * Tempalte using for onboarding new customers.
               */

              await logger.info(
                { owner, event: 'installation.created' },
                `bootstraping config repo`,
              )

              const template: GHTree = loadTreeFromPath(TEMPLATES.yaml, [
                'dist',
                'node_modules',
                '.DS_Store',
                /.*\.log.*/,
                /.*\.lock.*/,
              ])

              /* Bootstrap a configuration repository in organisation. */
              const personalisedTemplate = populateTempalte(template, {
                repository: configRepo,
                repositories: payload.repositories,
              })

              await bootstrapConfigRepository(
                github,
                { owner, repo: configRepo },
                personalisedTemplate,
              )

              await logger.info(
                { owner, event: 'installation.created' },
                `bootstraped repository: ${configRepo}`,
              )

              return
            }
            /* istanbul ignore next */
            default: {
              await logger.warn(
                { owner, event: 'installation.created' },
                `unsupported bootstrap type: ${payload.installation.account.type}`,
              )
              return
            }
          }
        }
      }
    } catch (err) /* istanbul ignore next */ {
      await logger.warn(
        {
          owner: payload.installation.account.login,
          event: 'installation.created',
        },
        err.message,
      )
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
  app.on(
    'push',
    withPurchase(prisma, async ({ payload, purchase, github, log }) => {
      const owner = payload.repository.owner.login
      const repo = payload.repository.name
      const ref = payload.ref
      const defaultRef = `refs/heads/${payload.repository.default_branch}`

      try {
        const configRepo = getLSConfigRepoName(owner)

        /* Skip non default branch and other repos pushes. */
        /* istanbul ignore if */
        if (defaultRef !== ref || configRepo !== repo) {
          await logger.debug(
            { owner, repo, event: 'push' },
            { defaultRef, ref, configRepo, repo },
            `skipping sync`,
          )
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
          await logger.info({ owner, repo, event: 'push' }, `no configuration`)
          return
        }

        const [error, config] = parseConfig(purchase, configRaw)

        await logger.debug(
          { owner, repo, event: 'push' },
          { config },
          `loaded configuration for ${owner}`,
        )

        /* Open an issue about invalid configuration. */
        if (error !== null) {
          await logger.debug(
            { owner, repo, event: 'push' },
            { config },
            `error in config ${error}`,
          )

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

          const issue = await openIssue(github, owner, configRepo, title, body)

          await logger.info(
            { owner, repo, event: 'push' },
            `opened issue ${issue.number}`,
          )

          return
        }

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(
          github,
          Object.keys(config!.repos),
        )

        await logger.debug(
          { owner, repo, event: 'push' },
          { access },
          `checking access`,
        )

        /* Skip configurations that we can't access. */
        switch (access.status) {
          case 'Sufficient': {
            await logger.info(
              { owner, repo, event: 'push' },
              `performing label sync`,
            )

            /* Performs sync. */

            const reports = await Promise.all(
              Object.keys(config!.repos).map((repo) =>
                handleLabelSync(github, owner, repo, config!.repos[repo], true),
              ),
            )

            await logger.debug(
              { owner, repo, event: 'push' },
              { config },
              `sync completed`,
            )

            /* Comment on commit */

            const report = generateHumanReadableReport(reports)
            const commit_sha: string = payload.after

            await github.repos.createCommitComment({
              owner,
              repo,
              commit_sha,
              body: report,
            })

            /* Closes issues */

            // TODO: close issues on successful sync.

            return
          }
          case 'Insufficient': {
            await logger.debug(
              { owner, repo, event: 'push' },
              { config, access },
              `insufficient permissions: ${access.missing.join(', ')}`,
            )

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

            const issue = await openIssue(
              github,
              owner,
              configRepo,
              title,
              body,
            )

            await logger.info(
              { owner, repo, event: 'push' },
              `opened issue ${issue.number}`,
            )

            return
          }
        }
      } catch (err) /* istanbul ignore next */ {
        await logger.warn({ owner, repo, event: 'push' }, err.message)
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
  app.on(
    'pull_request',
    withPurchase(prisma, async ({ github, purchase, payload, log }) => {
      const owner = payload.repository.owner.login
      const repo = payload.repository.name
      const ref = payload.pull_request.head.ref
      const number = payload.pull_request.number
      try {
        const configRepo = getLSConfigRepoName(owner)

        await logger.info(
          { owner, repo, event: 'pullrequest' },
          `pr action ${payload.action}`,
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
        if (
          compare.data.files.every((file) => file.filename !== LS_CONFIG_PATH)
        ) {
          await logger.debug(
            { owner, repo, event: 'pullrequest' },
            { files: compare.data.files },
            `no merge comment, configuration didn't change.`,
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
          await logger.info(
            { owner, repo, event: 'pullrequest' },
            `no configuration`,
          )
          return
        }

        const [error, config] = parseConfig(purchase, configRaw)

        await logger.debug(
          { owner, repo, event: 'pullrequest' },
          { config },
          `loaded configuration on ${ref}`,
        )

        /* Skips invalid configuration. */
        /* istanbul ignore if */
        if (error !== null) return

        switch (payload.action) {
          case 'opened':
          case 'reopened':
          case 'ready_for_review':
          case 'review_requested':
          case 'synchronize':
          case 'edited': {
            /* Review pull request. */

            /* Verify that we can access all configured files. */
            const access = await checkInstallationAccess(
              github,
              Object.keys(config!.repos),
            )

            await logger.debug(
              { owner, repo, event: 'pullrequest' },
              { access },
              `checking access`,
            )

            /* Skip configurations that we can't access. */
            switch (access.status) {
              case 'Sufficient': {
                await logger.info(
                  { owner, repo, event: 'pullrequest' },
                  `simulating sync`,
                )

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
                const comment = await createPRComment(
                  github,
                  owner,
                  configRepo,
                  number,
                  report,
                )

                await logger.info(
                  { owner, repo, event: 'pullrequest' },
                  `commented on pr ${comment.id}`,
                )

                return
              }
              case 'Insufficient': {
                await logger.debug(
                  { owner, repo, event: 'pullrequest' },
                  { config, access },
                  `insufficient permissions`,
                )

                /* Opens up an issue about insufficient permissions. */
                const body = ml`
            | It seems like this configuration stretches beyond repositories we can access. Please update it so we can help you as best as we can.
            |
            | _Missing repositories:_
            | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
            `

                const comment = await createPRComment(
                  github,
                  owner,
                  configRepo,
                  number,
                  body,
                )

                await logger.info(
                  { owner, repo, event: 'pullrequest' },
                  `commented on pr ${comment.id}`,
                )

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
            await logger.info(
              { owner, repo, event: 'pullrequest' },
              `ignoring event ${payload.action}`,
            )
            return
          }
          /* istanbul ignore next */
          default: {
            /* Log unsupported pull_request action. */
            await logger.warn(
              { owner, repo, event: 'pullrequest' },
              `unsupported event: ${payload.action}`,
            )

            return
          }
        }
      } catch (err) /* istanbul ignore next */ {
        await logger.warn({ owner, repo, event: 'pullrequest' }, err.message)
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
  app.on(
    'label.created',
    withSources(prisma, async (ctx) => {
      const owner = ctx.payload.sender.login
      const repo = ctx.payload.repository.name
      const config = ctx.sources.config.repos[repo]
      const label = ctx.payload.label as GithubLabel

      try {
        await logger.info(
          { owner, repo, event: 'label.created' },
          `created new label ${label.name}`,
        )

        /* Ignore no configuration. */
        /* istanbul ignore if */
        if (!config) {
          await logger.info(
            { owner, repo, event: 'label.created' },
            `no config`,
          )
          return
        }

        /* Ignore complying changes. */
        /* istanbul ignore if */
        if (config.labels.hasOwnProperty(label.name)) {
          await logger.info(
            { owner, repo, event: 'label.created' },
            `label in configuration`,
          )
          return
        }

        /* Config */
        const removeUnconfiguredLabels = withDefault(
          false,
          config.config?.removeUnconfiguredLabels,
        )

        if (removeUnconfiguredLabels) {
          await logger.info(
            { owner, repo, event: 'label.created' },
            `removing label ${label.name}`,
          )

          /* Prune unsupported labels in strict repositories. */
          await removeLabelsFromRepository(
            ctx.github,
            { repo, owner },
            [label],
            removeUnconfiguredLabels,
          )

          /* prettier-ignore */
          await logger.info({ owner, repo, event: 'label.created' }, ` removed label ${label.name}`)
        }
      } catch (err) /* istanbul ignore next */ {
        await logger.warn({ owner, event: 'label.created' }, err.message)
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
  app.on(
    'issues.labeled',
    withSources(prisma, async (ctx) => {
      const owner = ctx.payload.sender.login
      const repo = ctx.payload.repository.name
      const config = ctx.sources.config.repos[repo]
      const label = ((ctx.payload as any) as { label: GithubLabel }).label
      const issue = ctx.payload.issue

      try {
        await logger.info(
          { owner, repo, event: 'issues.labeled' },
          `labeled issue ${issue.number} with ${label.name}`,
        )

        /* Ignore changes in non-strict config */
        /* istanbul ignore if */
        if (!config) {
          /* prettier-ignore */
          await logger.info({ owner, repo, event: 'label.created' }, `${issue.number}:issues.labeled:${label.name} no configuration`)
          return
        }

        /* istanbul ignore if */
        if (!config.labels.hasOwnProperty(label.name)) {
          /* prettier-ignore */
          await logger.info({ owner, repo, event: 'label.created' }, `${issue.number}:issues.labeled:${label.name} unconfigured label`)
          return
        }

        /* Find siblings. */
        const siblings = withDefault([], config.labels[label.name]?.siblings)
        const ghSiblings = siblings.map((sibling) => ({ name: sibling }))

        /* prettier-ignore */
        await logger.info({ owner, repo, event: 'label.created' }, `siblings on issue ${issue.number}: ${siblings.join(', ')}`)
        /* prettier-ignore */
        await logger.debug({ owner, repo, event: 'label.created' }, {siblings}, `issue ${issue.number} adding siblings to ${label.name}`)

        await addLabelsToIssue(
          ctx.github,
          { repo, owner, issue: issue.number },
          ghSiblings,
          true,
        )

        /* prettier-ignore */
        await logger.info({ owner, repo, event: 'label.created' }, `issue ${issue.number} added siblings to ${label.name}`)
      } catch (err) /* istanbul ignore next */ {
        await logger.warn({ owner, repo, event: 'label.created' }, err.message)
      }
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
  prisma: PrismaClient,
  fn: (ctx: Context<C> & { sources: Sources }) => Promise<T>,
): (ctx: Context<C> & { purchase?: Purchase }) => Promise<T | undefined> {
  return withPurchase(prisma, async (ctx) => {
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

    const [error, config] = parseConfig(ctx.purchase, configRaw)

    /* Skips invlaid config. */
    /* istanbul ignore if */
    if (error !== null) return
    ;(ctx as Context<C> & { sources: Sources }).sources = { config: config! }

    return fn(ctx as Context<C> & { sources: Sources })
  })
}

/**
 * Wraps a function inside a sources loader.
 */
function withPurchase<
  C extends
    | Webhooks.WebhookPayloadCheckRun
    | Webhooks.WebhookPayloadCheckSuite
    | Webhooks.WebhookPayloadCommitComment
    | Webhooks.WebhookPayloadLabel
    | Webhooks.WebhookPayloadIssues
    | Webhooks.WebhookPayloadIssueComment
    | Webhooks.WebhookPayloadPullRequest
    | Webhooks.WebhookPayloadPullRequestReview
    | Webhooks.WebhookPayloadPullRequestReviewComment
    | Webhooks.WebhookPayloadPush,
  T
>(
  prisma: PrismaClient,
  fn: (ctx: Context<C> & { purchase?: Purchase | null }) => Promise<T>,
): (ctx: Context<C>) => Promise<T | undefined> {
  return async (ctx) => {
    const owner = ctx.payload.repository.owner.login

    try {
      /* Try to find the purchase in the database. */
      const purchase = await prisma.purchase.findOne({ where: { owner } })

      ;(ctx as Context<C> & { purchase?: Purchase | null }).purchase = purchase

      return fn(ctx as Context<C> & { purchase?: Purchase | null })
    } catch (err) /* istanbul ignore next */ {
      /* Report the error and skip evaluation. */
      await prisma.log.create({
        data: {
          event: 'purchase.load',
          message: `there was an error during loading the purchase`,
          type: 'WARN',
          owner,
        },
      })
      return
    }
  }
}
