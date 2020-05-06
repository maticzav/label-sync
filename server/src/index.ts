import Webhooks = require('@octokit/webhooks')
import { PrismaClient, Installation } from '@prisma/client'
import { Timber } from '@timberio/node'
import { ITimberLog } from '@timberio/types'
import bodyParser from 'body-parser'
import cors from 'cors'
import moment, { now } from 'moment'
import ml from 'multilines'
import os from 'os'
import path from 'path'
import { Application, Context } from 'probot'
import Stripe from 'stripe'

import { populateTemplate } from './bootstrap'
import {
  getLSConfigRepoName,
  LSCConfiguration,
  LS_CONFIG_PATH,
  parseConfig,
  configRepos,
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
import { loadTreeFromPath, withDefault } from './utils'
import { isNullOrUndefined } from 'util'

/* Templates */

const TEMPLATES = {
  yaml: path.resolve(__dirname, '../../templates/yaml'),
  typescript: path.resolve(__dirname, '../../templates/typescript'),
}

/* Subscription Plans */

interface Plans {
  ANNUALLY: string
  MONTHLY: string
}

export type Period = keyof Plans

const plans: Plans = {
  ANNUALLY: 'plan_HCkpZId8BCi7cI',
  MONTHLY: 'plan_HCkojOBbK8hFh6',
}

/* Application */

module.exports = (
  app: Application,
  /* Stored here for testing */
  prisma: PrismaClient = new PrismaClient(),
  timber: Timber = new Timber(
    process.env.TIMBER_API_KEY!,
    process.env.TIMBER_SOURCE_ID!,
    { ignoreExceptions: true },
  ),
  stripe: Stripe = new Stripe(process.env.STRIPE_API_KEY!, {
    apiVersion: '2020-03-02',
  }),
) => {
  /* Start the server */

  app.log(`LabelSync manager up and running! 🚀`)

  /*  */

  /**
   * Runs the script once on the server.
   */
  /* istanbul ignore next */
  async function migrate() {
    await timber.info('Migrating...')

    const gh = await app.auth()

    /* Github Installations */
    const ghapp = await gh.apps.getAuthenticated().then((res) => res.data)

    /* Tracked installations */
    const lsInstallations = await prisma.installation.count()
    await timber.info(`Existing installations: ${ghapp.installations_count}`)

    /* Skip sync if all are already tracked. */
    if (lsInstallations === ghapp.installations_count) {
      await timber.info(`All installations in sync.`)
      return
    }

    const installations = await gh.apps
      .listInstallations({
        page: 0,
        per_page: 100,
      })
      .then((res) => res.data)

    /* Process installations */
    for (const installation of installations) {
      await timber.info(`Syncing with database ${installation.account.login}`)
      const now = moment()
      await prisma.installation.upsert({
        where: { account: installation.account.login },
        create: {
          account: installation.account.login,
          email: null,
          plan: 'FREE',
          periodEndsAt: now.clone().add(3, 'years').toDate(),
          activated: true,
        },
        update: {},
      })
    }
  }

  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'production') {
    console.log('MIGRATING')
    migrate()
  }

  /* API */

  const api = app.route('/subscribe')

  api.use(
    cors({
      origin: [
        'https://label-sync.com',
        'https://www.label-sync.com',
        'https://webhook.label-sync.com',
      ],
      preflightContinue: true,
    }),
  )
  api.use(bodyParser.json())

  /**
   * Handles request for subscription.
   */
  api.post('/session', async (req, res) => {
    try {
      const { email, account, plan, agreed, period, coupon } = req.body

      if ([email, account].some((val) => val.trim() === '')) {
        return res.send({
          status: 'err',
          message: 'Some fields are missing.',
        })
      }

      /* Terms of Service */
      if (!agreed) {
        return res.send({
          status: 'err',
          message: 'You must agree with Terms of Service and Privacy Policy.',
        })
      }

      // Check for existing purchuses.

      /**
       * People shouldn't be able to change purchase information afterwards.
       */
      const now = moment()
      await prisma.installation.upsert({
        where: { account },
        create: {
          account,
          email,
          plan: 'FREE',
          periodEndsAt: now.clone().add(3, 'years').toDate(),
          activated: false,
        },
        update: {},
      })

      switch (plan) {
        case 'FREE': {
          /* Return a successful request to redirect to installation. */
          return res.send({ status: 'ok', plan: 'FREE' })
        }
        case 'PAID': {
          /* Figure out the plan */
          let plan: string

          switch (period) {
            case 'ANNUALLY': {
              plan = plans.ANNUALLY
              break
            }
            case 'MONTHLY': {
              plan = plans.MONTHLY
              break
            }
            /* istanbul ignore next */
            default: {
              throw new Error(`Unknown period ${period}.`)
            }
          }

          /* Create checkout session. */
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            subscription_data: {
              items: [{ plan }],
              metadata: {
                period,
                account,
              },
              coupon: coupon,
            },
            customer_email: email,
            expand: ['subscription'],
            success_url: 'https://label-sync.com/success',
            cancel_url: 'https://label-sync.com',
          })
          return res.send({ status: 'ok', plan: 'PAID', session: session.id })
        }
        /* istanbul ignore next */
        default: {
          throw new Error(`Unknown plan ${plan}.`)
        }
      }
    } catch (err) {
      await timber.warn(`Error in subscription flow: ${err.message}`)
      return res.send({ status: 'err', message: err.message })
    }
  })

  /* Stripe */

  const router = app.route('/stripe')

  router.post(
    '/',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res) => {
      /**
       * Stripe Webhook handler.
       */
      let event

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'] as string,
          process.env.STRIPE_ENDPOINT_SECRET!,
        )
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`)
      }

      /* Event handlers */

      switch (event.type) {
        /* Customer successfully subscribed to LabelSync */
        case 'checkout.session.completed':
        /* Customer paid an invoice */
        case 'invoice.payment_succeeded': {
          const payload = event.data.object as {
            subscription: string
          }

          const sub = await stripe.subscriptions.retrieve(payload.subscription)

          /* Calculate expiration date. */
          const now = moment()
          let expiresAt
          switch (sub.metadata.period) {
            case 'ANNUALLY': {
              expiresAt = now.clone().add(1, 'year').add(3, 'day')
              break
            }
            case 'MONTHLY': {
              expiresAt = now.clone().add(1, 'month').add(3, 'day')
              break
            }
            /* istanbul ingore next */
            default: {
              throw new Error(`Unknown period ${sub.metadata.period}`)
            }
          }

          /* Update the installation in the database. */
          await prisma.installation.update({
            where: { account: sub.metadata.account },
            data: {
              plan: 'PAID',
              periodEndsAt: expiresAt.toDate(),
              activated: true,
            },
          })

          return res.json({ received: true })
        }
        /* Stripe created an invoice. */
        case 'invoice.created': {
          /* stripe has created an invoice */
          return res.json({ received: true })
        }
        /* istanbul ignore next */
        default: {
          await timber.warn(`unhandled stripe webhook event: ${event.type}`)
          return res.status(400).end()
        }
      }
      /* End of Stripe Webhook handler */
    },
  )

  /* Github. */

  /**
   * Marketplace purchase event
   *
   * Tasks:
   *  - reference the purchase in the database.
   */
  // app.on('marketplace_purchase.purchased', async (ctx) => {
  //   // TODO: Github Marketplace.
  //   const purchase = ctx.payload.marketplace_purchase
  //   const owner = purchase.account

  //   // TODO: Add tier appropreately.
  //   const tier = ctx.payload.marketplace_purchase.plan.unit_name

  //   const dbpurchase = await prisma.purchase.create({
  //     data: {
  //       owner: owner.login,
  //       email: owner.organization_billing_email,
  //       plan: purchase.plan.name,
  //       planId: purchase.plan.id,
  //       tier: 'BASIC',
  //       type: owner.type === 'User' ? 'USER' : 'ORGANIZATION',
  //     },
  //   })

  // await ctx.logger.info(
  //   `${owner.login}: ${owner.type} purchased LabelSync plan ${dbpurchase.planId}`,
  // )
  // })

  /**
   * Marketplace purchase event
   *
   * Tasks:
   *  - reference the purchase in the database.
   */
  // app.on('marketplace_purchase.cancelled', async (ctx) => {
  //   // TODO: Github Marketplace.
  //   const purchase = ctx.payload.marketplace_purchase
  //   const owner = purchase.account

  //   const dbpurchase = await prisma.purchase.delete({
  //     where: {
  //       owner: owner.login,
  //     },
  //   })

  // await ctx.logger.info(
  //   { owner: owner.login, event: 'marketplace_purchase.cancelled' },
  //   `${owner.login} cancelled LabelSync plan ${dbpurchase.planId}`,
  // )
  // })

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
  app.on(
    'installation.created',
    withLogger(timber, async (ctx) => {
      const account = ctx.payload.installation.account
      const owner = account.login
      const configRepo = getLSConfigRepoName(owner)

      /* Find installation. */
      const now = moment()
      const installation = await prisma.installation.upsert({
        where: { account: owner },
        create: {
          account: owner,
          plan: 'FREE',
          periodEndsAt: now.clone().add(3, 'y').toDate(),
          activated: true,
        },
        update: {
          activated: true,
        },
      })

      await ctx.logger.info(`Onboarding ${owner}.`, {
        plan: installation.plan,
        periodEndsAt: installation.periodEndsAt,
      })

      /* See if config repository exists. */
      const repo = await getRepo(ctx.github, owner, configRepo)

      switch (repo.status) {
        case 'Exists': {
          /* Perform sync. */

          await ctx.logger.info(
            `User has existing repository in ${configRepo}, performing sync.`,
          )

          const ref = `refs/heads/${repo.repo.default_branch}`

          /* Load configuration */
          const configRaw = await getFile(
            ctx.github,
            { owner, repo: configRepo, ref },
            LS_CONFIG_PATH,
          )

          /* No configuration, skip the evaluation. */
          /* istanbul ignore next */
          if (configRaw === null) {
            await ctx.logger.info(`No configuration, skipping sync.`)
            return
          }

          const [error, config] = parseConfig(installation.plan, configRaw)

          /* Wrong configuration, open the issue. */
          if (error !== null) {
            await ctx.logger.info(`Error in config, skipping sync.`, {
              config: JSON.stringify(config),
              error: error,
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
            | ${error}
            |
            | Let us know if we can help you with the configuration by sending us an email to support@label-sync.com. We'll try to get back to you as quickly as possible.
            |
            | Best,
            | LabelSync Team
            `

            const issue = await openIssue(
              ctx.github,
              owner,
              configRepo,
              title,
              body,
            )

            await ctx.logger.info(`Opened issue ${issue.number}.`)
            return
          }

          /* Verify that we can access all configured files. */
          const access = await checkInstallationAccess(
            ctx.github,
            configRepos(config!),
          )

          switch (access.status) {
            case 'Sufficient': {
              await ctx.logger.info(`Performing sync.`)

              /* Performs sync. */
              for (const repo of configRepos(config!)) {
                await Promise.all([
                  handleLabelSync(
                    ctx.github,
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
              await ctx.logger.info(
                `Insufficient permissions, skipping sync.`,
                {
                  access: JSON.stringify(access),
                },
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
                ctx.github,
                owner,
                configRepo,
                title,
                body,
              )

              await ctx.logger.info(`Opened issue ${issue.number}.`)
              return
            }
          }
        }

        case 'Unknown': {
          await ctx.logger.info(
            `No existing repository for ${owner}, start onboarding.`,
          )

          /**
           * Bootstrap the configuration depending on the
           * type of the installation account.
           */
          const accountType = ctx.payload.installation.account.type
          switch (accountType) {
            /* istanbul ignore next */
            case 'User': {
              // TODO: Update once Github changes the settings
              await ctx.logger.info(`User account ${owner}, skip onboarding.`)
              return
            }
            case 'Organization': {
              /**
               * Tempalte using for onboarding new customers.
               */

              await ctx.logger.info(`Bootstraping config repo for ${owner}.`)

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
                repositories: ctx.payload.repositories,
              })

              await bootstrapConfigRepository(
                ctx.github,
                { owner, repo: configRepo },
                personalisedTemplate,
              )

              await ctx.logger.info(`Onboarding complete for ${owner}.`)

              return
            }
            /* istanbul ignore next */
            default: {
              await ctx.logger.warn(`Unsupported account type: ${accountType}`)
              return
            }
          }
        }
      }
    }),
  )

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
    withUserContextLogger(
      timber,
      withInstallation(prisma, async (ctx) => {
        const owner = ctx.payload.repository.owner.login
        const repo = ctx.payload.repository.name
        const ref = ctx.payload.ref
        const defaultRef = `refs/heads/${ctx.payload.repository.default_branch}`
        const commit_sha: string = ctx.payload.after

        const configRepo = getLSConfigRepoName(owner)

        /* Skip non default branch and other repos pushes. */
        /* istanbul ignore if */
        if (defaultRef !== ref || configRepo !== repo) {
          await ctx.logger.info(`Not config repo or ref. Skipping sync.`, {
            ref,
            repo,
            defaultRef,
            configRepo,
          })
          return
        }

        /* Load configuration */
        const configRaw = await getFile(
          ctx.github,
          { owner, repo, ref },
          LS_CONFIG_PATH,
        )

        /* Skip altogether if there's no configuration. */
        /* istanbul ignore next */
        if (configRaw === null) {
          await ctx.logger.info(`No configuration, skipping sync.`)
          return
        }

        const [error, config] = parseConfig(ctx.installation.plan, configRaw)

        /* Open an issue about invalid configuration. */
        if (error !== null) {
          await ctx.logger.info(`Error in config ${error}`, {
            config: JSON.stringify(config),
            error: error,
          })

          const report = ml`
            | It seems like your configuration uses a format unknown to me. 
            | That might be a consequence of invalid yaml cofiguration file. 
            |
            | Here's what I am having problems with:
            |
            | ${error}
            `

          await ctx.github.repos.createCommitComment({
            owner,
            repo,
            commit_sha,
            body: report,
          })

          await ctx.logger.info(`Commented on commit ${commit_sha}.`)
          return
        }

        await ctx.logger.info(`Configuration loaded.`, {
          config: JSON.stringify(config),
        })

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(
          ctx.github,
          configRepos(config!),
        )

        /* Skip configurations that we can't access. */
        switch (access.status) {
          case 'Sufficient': {
            await ctx.logger.info(`Performing label sync on ${owner}.`)

            /* Performs sync. */

            const reports = await Promise.all(
              configRepos(config!).map((repo) =>
                handleLabelSync(
                  ctx.github,
                  owner,
                  repo,
                  config!.repos[repo],
                  true,
                ),
              ),
            )

            await ctx.logger.info(`Sync completed.`, {
              config: JSON.stringify(config),
            })

            /* Comment on commit */

            const report = generateHumanReadableReport(reports)
            const commit_sha: string = ctx.payload.after

            await ctx.github.repos.createCommitComment({
              owner,
              repo,
              commit_sha,
              body: report,
            })

            return
          }
          case 'Insufficient': {
            await ctx.logger.info(
              `Insufficient permissions: ${access.missing.join(', ')}`,
              {
                config: JSON.stringify(config),
                access: JSON.stringify(access),
              },
            )

            const commit_sha: string = ctx.payload.after
            const report = ml`
            | Your configuration stretches beyond repositories I can access. 
            | Please update it so I may sync your labels.
            |
            | _Missing repositories:_
            | ${access.missing.map((missing) => ` * ${missing}`).join(os.EOL)}
            `

            await ctx.github.repos.createCommitComment({
              owner,
              repo,
              commit_sha,
              body: report,
            })

            await ctx.logger.info(`Commented on commit ${commit_sha}.`)
            return
          }
        }
      }),
    ),
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
    withUserContextLogger(
      timber,
      withInstallation(prisma, async (ctx) => {
        const owner = ctx.payload.repository.owner.login
        const repo = ctx.payload.repository.name
        const ref = ctx.payload.pull_request.head.ref
        const number = ctx.payload.pull_request.number

        const configRepo = getLSConfigRepoName(owner)

        await ctx.logger.info(`PullRequest action: ${ctx.payload.action}`)

        /* istanbul ignore if */
        if (configRepo !== repo) {
          await ctx.logger.info(
            `Not configuration repository, skipping pull request overview.`,
            { configurationRepo: configRepo, currentRepo: repo },
          )
          return
        }

        /* Check changed files */
        const compare = await ctx.github.repos.compareCommits({
          owner: owner,
          repo: repo,
          base: ctx.payload.pull_request.base.ref,
          head: ctx.payload.pull_request.head.ref,
        })

        /* istanbul ignore next */
        if (
          compare.data.files.every((file) => file.filename !== LS_CONFIG_PATH)
        ) {
          await ctx.logger.info(
            `Configuration didn't change, skipping comment.`,
            {
              files: compare.data.files.map((file) => file.filename).join(', '),
            },
          )
          return
        }

        /* Load configuration */
        const configRaw = await getFile(
          ctx.github,
          { owner, repo, ref },
          LS_CONFIG_PATH,
        )

        /* Skip the pull request if there's no configuraiton. */
        /* istanbul ignore next */
        if (configRaw === null) {
          await ctx.logger.info(`No configuration, skipping comment.`)
          return
        }

        const [error, config] = parseConfig(ctx.installation.plan, configRaw)

        /* Skips invalid configuration. */
        /* istanbul ignore if */
        if (error !== null) {
          await ctx.logger.info(`Invalid configuration on ${ref}`, {
            config: JSON.stringify(config),
            error: error,
          })

          const report = ml`
          | Your configuration seems a bit strange. Here's what I am having problems with:
          |
          | ${error}
          `

          /* Comment on a PR in a human friendly way. */
          const comment = await createPRComment(
            ctx.github,
            owner,
            configRepo,
            number,
            report,
          )

          await ctx.logger.info(`Commented on PullRequest (${comment.id})`)
          return
        }

        await ctx.logger.info(`Configration loaded configuration on ${ref}`, {
          config: JSON.stringify(config),
        })

        /* Tackle PR Action */

        switch (ctx.payload.action) {
          case 'opened':
          case 'reopened':
          case 'ready_for_review':
          case 'review_requested':
          case 'synchronize':
          case 'edited': {
            /* Review pull request. */

            /* Verify that we can access all configured files. */
            const access = await checkInstallationAccess(
              ctx.github,
              configRepos(config!),
            )

            /* Skip configurations that we can't access. */
            switch (access.status) {
              case 'Sufficient': {
                await ctx.logger.info(`Simulating sync.`)

                /* Fetch changes to repositories. */
                const reports = await Promise.all(
                  configRepos(config!).map((repo) =>
                    handleLabelSync(
                      ctx.github,
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
                  ctx.github,
                  owner,
                  configRepo,
                  number,
                  report,
                )

                await ctx.logger.info(
                  `Commented on PullRequest (${comment.id})`,
                )

                return
              }
              case 'Insufficient': {
                await ctx.logger.info(`Insufficient permissions`)

                /* Opens up an issue about insufficient permissions. */
                const body = ml`
                | It seems like this configuration stretches beyond repositories we can access. Please update it so we can help you as best as we can.
                |
                | _Missing repositories:_
                | ${access.missing
                  .map((missing) => ` * ${missing}`)
                  .join(os.EOL)}
                `

                const comment = await createPRComment(
                  ctx.github,
                  owner,
                  configRepo,
                  number,
                  body,
                )

                await ctx.logger.info(`Commented on PullRequest ${comment.id}`)

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
            await ctx.logger.info(`Ignoring event ${ctx.payload.action}.`)
            return
          }
          /* istanbul ignore next */
          default: {
            /* Log unsupported pull_request action. */
            /* prettier-ignore */
            await ctx.logger.warn(`Unhandled PullRequest action: ${ctx.payload.action}`)
            return
          }
        }
      }),
    ),
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
    withUserContextLogger(
      timber,
      withInstallation(
        prisma,
        withSources(async (ctx) => {
          const owner = ctx.payload.sender.login
          const repo = ctx.payload.repository.name
          const config =
            ctx.sources.config.repos[repo] || ctx.sources.config.repos['*']
          const label = ctx.payload.label as GithubLabel

          await ctx.logger.info(`New label create in ${repo}: "${label.name}".`)

          /* Ignore no configuration. */
          /* istanbul ignore if */
          if (!config) {
            await ctx.logger.info(`No configuration, skipping`)
            return
          }

          /* Ignore complying changes. */
          /* istanbul ignore if */
          if (config.labels.hasOwnProperty(label.name)) {
            await ctx.logger.info(`Label is configured, skipping removal.`)
            return
          }

          /* Config */
          const removeUnconfiguredLabels = withDefault(
            false,
            config.config?.removeUnconfiguredLabels,
          )

          if (removeUnconfiguredLabels) {
            await ctx.logger.info(
              `Removing label "${label.name}" from ${repo}.`,
            )

            /* Prune unsupported labels in strict repositories. */
            await removeLabelsFromRepository(
              ctx.github,
              { repo, owner },
              [label],
              removeUnconfiguredLabels,
            )

            await ctx.logger.info(`Removed label "${label.name}" from ${repo}.`)
          }
        }),
      ),
    ),
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
    withUserContextLogger(
      timber,
      withInstallation(
        prisma,
        withSources(async (ctx) => {
          const owner = ctx.payload.sender.login
          const repo = ctx.payload.repository.name
          const config = ctx.sources.config.repos[repo]
          const label = ((ctx.payload as any) as { label: GithubLabel }).label
          const issue = ctx.payload.issue

          await ctx.logger.info(
            `Issue (${issue.number}) has been labeled with "${label.name}".`,
          )

          /* Ignore changes in non-strict config */
          /* istanbul ignore if */
          if (!config) {
            await ctx.logger.info(`No configuration found, skipping.`)
            return
          }

          /* istanbul ignore if */
          if (!config.labels.hasOwnProperty(label.name)) {
            await ctx.logger.info(
              `Unconfigured label "${label.name}", skipping.`,
            )
            return
          }

          /* Find siblings. */
          const siblings = withDefault([], config.labels[label.name]?.siblings)
          const ghSiblings = siblings.map((sibling) => ({ name: sibling }))

          await addLabelsToIssue(
            ctx.github,
            { repo, owner, issue: issue.number },
            ghSiblings,
            true,
          )

          /* prettier-ignore */
          await ctx.logger.info(`Added siblings of ${label.name} to issue ${issue.number}: ${siblings.join(', ')}`)
        }),
      ),
    ),
  )

  /**
   * New repository created
   *
   * Tasks:
   *  - check if there's a wildcard configuration
   *  - sync labels on that repository
   */
  app.on(
    'repository.created',
    withUserContextLogger(
      timber,
      withInstallation(
        prisma,
        withSources(async (ctx) => {
          const owner = ctx.payload.sender.login
          const repo = ctx.payload.repository.name
          const config =
            ctx.sources.config.repos[repo] || ctx.sources.config.repos['*']

          await ctx.logger.info(`New repository ${repo} in ${owner}.`)

          /* Ignore no configuration. */
          /* istanbul ignore if */
          if (!config) {
            await ctx.logger.info(`No configuration, skipping sync.`)
            return
          }

          await ctx.logger.info(`Performing sync on ${repo}.`)
          await handleLabelSync(ctx.github, owner, repo, config, true)
          await ctx.logger.info(`Repository synced ${repo}.`)
        }),
      ),
    ),
  )
}

interface Sources {
  config: LSCConfiguration
}

/**
 * Wraps a function inside a sources loader.
 */
function withSources<
  /* Context */
  C extends
    | Webhooks.WebhookPayloadCheckRun
    | Webhooks.WebhookPayloadIssues
    | Webhooks.WebhookPayloadLabel
    | Webhooks.WebhookPayloadPullRequest,
  /* Additional context fields */
  W extends { installation: Installation },
  /* Return type */
  T
>(
  fn: (ctx: Context<C> & W & { sources: Sources }) => Promise<T>,
): (ctx: Context<C> & W) => Promise<T | undefined> {
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

    const [error, config] = parseConfig(ctx.installation.plan, configRaw)

    /* Skips invlaid config. */
    /* istanbul ignore if */
    if (error !== null) return
    ;(ctx as Context<C> & W & { sources: Sources }).sources = {
      config: config!,
    }

    return fn(ctx as Context<C> & W & { sources: Sources })
  }
}

/**
 * Wraps a function inside a sources loader.
 */
function withInstallation<
  /* Context */
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
  /* Additional context fields */
  W,
  /* Return type */
  T
>(
  prisma: PrismaClient,
  fn: (ctx: Context<C> & W & { installation: Installation }) => Promise<T>,
): (ctx: Context<C> & W) => Promise<T | undefined> {
  return async (ctx) => {
    const owner = ctx.payload.repository.owner.login
    const now = moment()

    /* Try to find the purchase in the database. */
    let installation = await prisma.installation.findOne({
      where: { account: owner },
    })

    /* istanbul ignore if */
    if (isNullOrUndefined(installation)) {
      throw new Error(`Couldn't find installation for ${owner}.`)
    }

    /* Handle expired purchases */
    /* istanbul ignore if */
    if (moment(installation.periodEndsAt).isBefore(now)) {
      return
    }

    ;(ctx as Context<C> &
      W & {
        installation: Installation
      }).installation = installation
    return fn(ctx as Context<C> & W & { installation: Installation })
  }
}

/**
 * Wraps event handler in logger and creates a context.
 */
function withUserContextLogger<
  /* Context */
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
  /* Return type */
  T
>(
  timber: Timber,
  fn: (ctx: Context<C> & { logger: Timber }) => Promise<T>,
): (ctx: Context<C>) => Promise<T | undefined> {
  return async (ctx) => {
    const owner = ctx.payload.repository.owner
    const repo = ctx.payload.repository

    const action =
      (ctx.payload as
        | Webhooks.WebhookPayloadCheckRun
        | Webhooks.WebhookPayloadCheckSuite
        | Webhooks.WebhookPayloadCommitComment
        | Webhooks.WebhookPayloadLabel
        | Webhooks.WebhookPayloadIssues
        | Webhooks.WebhookPayloadIssueComment
        | Webhooks.WebhookPayloadPullRequest
        | Webhooks.WebhookPayloadPullRequestReview
        | Webhooks.WebhookPayloadPullRequestReviewComment).action || 'push'

    /**
     * Current user context.
     *  - webhook event,
     *  - repo: name
     *  - user: id, login (name), and type (Org, User)
     */
    async function addCurrentUser(log: ITimberLog): Promise<ITimberLog> {
      return {
        ...log,
        event: {
          name: ctx.event,
          action: action,
        },
        repo: {
          name: repo.name,
        },
        user: {
          id: owner.id,
          owner: owner.login,
          type: owner.type,
        },
        context: {
          user_id: owner.id,
        },
      }
    }

    /**
     * Attach the current user context.
     * Run the event handler.
     * Remove the middleware.
     */
    try {
      timber.use(addCurrentUser)
      ;(ctx as Context<C> & { logger: Timber }).logger = timber
      return await fn(ctx as Context<C> & { logger: Timber })
    } catch (err) /* istanbul ignore next */ {
      /* Report the error and skip evaluation. */
      await timber.warn(`Event resulted in error.`, { error: err.message })
      if (process.env.NODE_ENV !== 'production') console.error(err)
    } finally {
      timber.remove(addCurrentUser)
    }

    /* istanbul ignore next */
    return undefined
  }
}

/**
 * Wraps event handler in logger and creates a context.
 */
function withLogger<
  /* Context */
  C extends
    | Webhooks.WebhookPayloadMarketplacePurchase
    | Webhooks.WebhookPayloadInstallation
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
  /* Return type */
  T
>(
  timber: Timber,
  fn: (ctx: Context<C> & { logger: Timber }) => Promise<T>,
): (ctx: Context<C>) => Promise<T | undefined> {
  return async (ctx) => {
    /**
     * Current user context.
     *  - webhook event,
     *  - repo: name
     *  - user: id, login (name), and type (Org, User)
     */
    async function addEvent(log: ITimberLog): Promise<ITimberLog> {
      return {
        ...log,
        event: ctx.event,
      }
    }

    /**
     * Attach the current user context.
     * Run the event handler.
     * Remove the middleware.
     */
    try {
      timber.use(addEvent)
      ;(ctx as Context<C> & { logger: Timber }).logger = timber
      return await fn(ctx as Context<C> & { logger: Timber })
    } catch (err) /* istanbul ignore next */ {
      /* Report the error and skip evaluation. */
      await timber.warn(`Event resulted in error.`, { error: err.message })
      if (process.env.NODE_ENV !== 'production') console.error(err)
    } finally {
      timber.remove(addEvent)
    }

    /* istanbul ignore next */
    return undefined
  }
}
