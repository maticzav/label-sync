import Webhooks = require('@octokit/webhooks')
import { PrismaClient, Installation } from '@prisma/client'
import bodyParser from 'body-parser'
import cors from 'cors'
import _ from 'lodash'
import moment from 'moment'
import ml from 'multilines'
import os from 'os'
import path from 'path'
import { Application, Context } from 'probot'
import Stripe from 'stripe'
import { createLogger, Logger, transports, format } from 'winston'

import { populateTemplate } from './bootstrap'
import {
  getLSConfigRepoName,
  LSCConfiguration,
  LS_CONFIG_PATH,
  parseConfig,
  configRepos,
  isConfigRepo,
  LSCRepository,
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
import { create } from 'handlebars'

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

const plans: Plans =
  process.env.NODE_ENV === 'test'
    ? {
        ANNUALLY: 'plan_HEG5LPquldqfJp',
        MONTHLY: 'plan_HEG5wHlZp4io5Q',
      }
    : {
        ANNUALLY: 'price_HKxac3217AdNnw',
        MONTHLY: 'price_HKxYK7gvZO3ieE',
      }
// : {
//     ANNUALLY: 'plan_HCkpZId8BCi7cI',
//     MONTHLY: 'plan_HCkojOBbK8hFh6',
//   }

const corsOrigins =
  process.env.NODE_ENV === 'test'
    ? ['http://localhost', 'http://127.0.0.1']
    : [
        'https://label-sync.com',
        'https://www.label-sync.com',
        'https://webhook.label-sync.com',
      ]

/* Application */

module.exports = (
  app: Application,
  /* Stored here for testing */
  prisma: PrismaClient = new PrismaClient(),
  winston: Logger = createLogger({
    level: 'debug',
    exitOnError: false,
    format: format.json(),
    transports: [
      new transports.Http({
        host: 'http-intake.logs.datadoghq.com',
        path: `/v1/input/${process.env.DATADOG_APIKEY}?ddsource=nodejs`,
        ssl: true,
      }),
    ],
  }),
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
    winston.info('Migrating...')

    const gh = await app.auth()

    /* Github Installations */
    const ghapp = await gh.apps.getAuthenticated().then((res) => res.data)

    /* Tracked installations */
    const lsInstallations = await prisma.installation.count({
      where: { activated: true },
    })
    winston.info(`Existing installations: ${ghapp.installations_count}`)

    /* Skip sync if all are already tracked. */
    if (lsInstallations >= ghapp.installations_count) {
      winston.info(`All installations in sync.`)
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
      winston.info(`Syncing with database ${installation.account.login}`)
      const now = moment()
      const account = installation.account.login.toLowerCase()
      await prisma.installation.upsert({
        where: { account },
        create: {
          account,
          email: null,
          plan: 'FREE',
          periodEndsAt: now.clone().add(3, 'years').toDate(),
          activated: true,
        },
        update: {
          activated: true,
        },
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
      origin: corsOrigins,
      preflightContinue: true,
    }),
  )
  api.use(bodyParser.json())

  /**
   * Handles request for subscription.
   */
  api.post('/session', async (req, res) => {
    try {
      let { email, account, plan, agreed, period, coupon } = req.body as {
        [key: string]: string
      }

      /* istanbul ignore next */
      if ([email, account].some((val) => val.trim() === '')) {
        return res.send({
          status: 'err',
          message: 'Some fields are missing.',
        })
      }

      /* istanbul ignore next */
      if (!['PAID', 'FREE'].includes(plan)) {
        return res.send({
          status: 'err',
          message: `Invalid plan ${plan}.`,
        })
      }

      /* istanbul ignore next */
      if (plan === 'PAID' && !['MONTHLY', 'ANNUALLY'].includes(period)) {
        return res.send({
          status: 'err',
          message: `Invalid period for paid plan ${period}.`,
        })
      }

      /* Terms of Service */
      /* istanbul ignore next */
      if (!agreed) {
        return res.send({
          status: 'err',
          message: 'You must agree with Terms of Service and Privacy Policy.',
        })
      }

      /* Valid coupon */
      /* istanbul ignore next */
      if (
        coupon !== undefined &&
        (typeof coupon !== 'string' || coupon.trim() === '')
      ) {
        return res.send({
          status: 'err',
          message: 'Invalid coupon provided.',
        })
      }

      /* Unify account casing */
      account = account.toLowerCase()

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
            case 'MONTHLY':
            case 'ANNUALLY': {
              plan = plans[period as Period]
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
              coupon,
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
    } catch (err) /* istanbul ignore next */ {
      winston.warn(`Error in subscription flow: ${err.message}`)
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
      } catch (err) /* istanbul ingore next */ {
        winston.warn(`Error in stripe webhook deconstruction.`, {
          meta: {
            error: err.message,
          },
        })
        return res.status(400).send(`Webhook Error: ${err.message}`)
      }

      /* Logger */

      winston.info(`Stripe event ${event.type}`, {
        meta: {
          payload: JSON.stringify(event.data.object),
        },
      })

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
          const installation = await prisma.installation.update({
            where: { account: sub.metadata.account },
            data: {
              plan: 'PAID',
              periodEndsAt: expiresAt.toDate(),
            },
          })

          winston.info(`New subscriber ${installation.account}`, {
            meta: {
              plan: 'PAID',
              periodEndsAt: installation.periodEndsAt,
            },
          })

          return res.json({ received: true })
        }
        /* istanbul ignore next */
        default: {
          winston.warn(`unhandled stripe webhook event: ${event.type}`)
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
  //       owner: owner.login.toLowerCase(),
  //       email: owner.organization_billing_email,
  //       plan: purchase.plan.name,
  //       planId: purchase.plan.id,
  //       tier: 'BASIC',
  //       type: owner.type === 'User' ? 'USER' : 'ORGANIZATION',
  //     },
  //   })

  // ctx.logger.info(
  //   `${owner.login.toLowerCase()}: ${owner.type} purchased LabelSync plan ${dbpurchase.planId}`,
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
  //       owner: owner.login.toLowerCase(),
  //     },
  //   })

  // ctx.logger.info(
  //   { owner: owner.login.toLowerCase(), event: 'marketplace_purchase.cancelled' },
  //   `${owner.login.toLowerCase()} cancelled LabelSync plan ${dbpurchase.planId}`,
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
    withLogger(winston, async (ctx) => {
      const account = ctx.payload.installation.account
      const owner = account.login.toLowerCase()
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

      ctx.logger.info(`Onboarding ${owner}.`, {
        meta: {
          plan: installation.plan,
          periodEndsAt: installation.periodEndsAt,
        },
      })

      /* See if config repository exists. */
      const repo = await getRepo(ctx.github, owner, configRepo)

      switch (repo.status) {
        case 'Exists': {
          /* Perform sync. */

          ctx.logger.info(
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
            ctx.logger.info(`No configuration, skipping sync.`)
            return
          }

          const [error, config] = parseConfig(installation.plan, configRaw)

          /* Wrong configuration, open the issue. */
          if (error !== null) {
            ctx.logger.info(`Error in config, skipping sync.`, {
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

            ctx.logger.info(`Opened issue ${issue.number}.`)
            return
          }

          /* Verify that we can access all configured files. */
          const access = await checkInstallationAccess(
            ctx.github,
            configRepos(config!),
          )

          switch (access.status) {
            case 'Sufficient': {
              ctx.logger.info(`Performing sync.`)

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
              ctx.logger.info(`Insufficient permissions, skipping sync.`, {
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

              const issue = await openIssue(
                ctx.github,
                owner,
                configRepo,
                title,
                body,
              )

              ctx.logger.info(`Opened issue ${issue.number}.`)
              return
            }
          }
        }

        case 'Unknown': {
          ctx.logger.info(
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
              ctx.logger.info(`User account ${owner}, skip onboarding.`)
              return
            }
            case 'Organization': {
              /**
               * Tempalte using for onboarding new customers.
               */

              ctx.logger.info(`Bootstraping config repo for ${owner}.`)

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

              ctx.logger.info(`Onboarding complete for ${owner}.`)

              return
            }
            /* istanbul ignore next */
            default: {
              ctx.logger.warn(`Unsupported account type: ${accountType}`)
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
      winston,
      withInstallation(prisma, async (ctx) => {
        const owner = ctx.payload.repository.owner.login.toLowerCase()
        const repo = ctx.payload.repository.name
        const ref = ctx.payload.ref
        const defaultRef = `refs/heads/${ctx.payload.repository.default_branch}`
        const commit_sha: string = ctx.payload.after

        const configRepo = getLSConfigRepoName(owner)

        /* Skip non default branch and other repos pushes. */
        /* istanbul ignore if */
        if (defaultRef !== ref || !isConfigRepo(owner, repo)) {
          ctx.logger.info(`Not config repo or ref. Skipping sync.`, {
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
        const configRaw = await getFile(
          ctx.github,
          { owner, repo, ref },
          LS_CONFIG_PATH,
        )

        /* Skip altogether if there's no configuration. */
        /* istanbul ignore next */
        if (configRaw === null) {
          ctx.logger.info(`No configuration, skipping sync.`)
          return
        }

        const [error, config] = parseConfig(ctx.installation.plan, configRaw)

        /* Open an issue about invalid configuration. */
        if (error !== null) {
          ctx.logger.info(`Error in config ${error}`, {
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

          await ctx.github.repos.createCommitComment({
            owner,
            repo,
            commit_sha,
            body: report,
          })

          ctx.logger.info(`Commented on commit ${commit_sha}.`)
          return
        }

        ctx.logger.info(`Configuration loaded.`, {
          meta: {
            config: JSON.stringify(config),
          },
        })

        /* Verify that we can access all configured files. */
        const access = await checkInstallationAccess(
          ctx.github,
          configRepos(config!),
        )

        /* Skip configurations that we can't access. */
        switch (access.status) {
          case 'Sufficient': {
            ctx.logger.info(`Performing label sync on ${owner}.`)

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

            ctx.logger.info(`Sync completed.`, {
              meta: {
                config: JSON.stringify(config),
                reports: JSON.stringify(reports),
              },
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
            ctx.logger.info(
              `Insufficient permissions: ${access.missing.join(', ')}`,
              {
                meta: {
                  config: JSON.stringify(config),
                  access: JSON.stringify(access),
                },
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

            ctx.logger.info(`Commented on commit ${commit_sha}.`)
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
      winston,
      withInstallation(prisma, async (ctx) => {
        const owner = ctx.payload.repository.owner.login.toLowerCase()
        const repo = ctx.payload.repository.name
        const ref = ctx.payload.pull_request.head.ref
        const number = ctx.payload.pull_request.number

        const configRepo = getLSConfigRepoName(owner)

        ctx.logger.info(`PullRequest action: ${ctx.payload.action}`)

        /* istanbul ignore if */
        if (!isConfigRepo(owner, repo)) {
          ctx.logger.info(
            `Not configuration repository, skipping pull request overview.`,
            { meta: { configurationRepo: configRepo, currentRepo: repo } },
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
          ctx.logger.info(`Configuration didn't change, skipping comment.`, {
            meta: {
              files: compare.data.files.map((file) => file.filename).join(', '),
            },
          })
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
          ctx.logger.info(`No configuration, skipping comment.`)
          return
        }

        const [error, config] = parseConfig(ctx.installation.plan, configRaw)

        /* Skips invalid configuration. */
        /* istanbul ignore if */
        if (error !== null) {
          ctx.logger.info(`Invalid configuration on ${ref}`, {
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

          /* Comment on a PR in a human friendly way. */
          const comment = await createPRComment(
            ctx.github,
            owner,
            configRepo,
            number,
            report,
          )

          ctx.logger.info(`Commented on PullRequest (${comment.id})`)
          return
        }

        ctx.logger.info(`Configration loaded configuration on ${ref}`, {
          meta: {
            config: JSON.stringify(config),
          },
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
                ctx.logger.info(`Simulating sync.`)

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

                ctx.logger.info(`Commented on PullRequest (${comment.id})`)

                return
              }
              case 'Insufficient': {
                ctx.logger.info(`Insufficient permissions`)

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

                ctx.logger.info(`Commented on PullRequest ${comment.id}`)

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
            ctx.logger.info(`Ignoring event ${ctx.payload.action}.`)
            return
          }
          /* istanbul ignore next */
          default: {
            /* Log unsupported pull_request action. */
            /* prettier-ignore */
            ctx.logger.warn(`Unhandled PullRequest action: ${ctx.payload.action}`)
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
      winston,
      withInstallation(
        prisma,
        withSources(async (ctx) => {
          const owner = ctx.payload.sender.login.toLowerCase()
          const repo = ctx.payload.repository.name.toLowerCase()
          const config =
            ctx.sources.config.repos[repo] || ctx.sources.config.repos['*']
          const label = ctx.payload.label as GithubLabel

          ctx.logger.info(`New label create in ${repo}: "${label.name}".`)

          /* Ignore no configuration. */
          /* istanbul ignore if */
          if (!config) {
            ctx.logger.info(`No configuration, skipping`)
            return
          }

          /* Ignore complying changes. */
          /* istanbul ignore if */
          if (config.labels.hasOwnProperty(label.name)) {
            ctx.logger.info(`Label is configured, skipping removal.`)
            return
          }

          /* Config */
          const removeUnconfiguredLabels = withDefault(
            false,
            config.config?.removeUnconfiguredLabels,
          )

          if (removeUnconfiguredLabels) {
            ctx.logger.info(`Removing "${label.name}" from ${repo}.`)

            /* Prune unsupported labels in strict repositories. */
            await removeLabelsFromRepository(
              ctx.github,
              { repo, owner },
              [label],
              removeUnconfiguredLabels,
            )

            ctx.logger.info(`Removed label "${label.name}" from ${repo}.`)
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
    ['issues.labeled', 'pull_request.labeled'],
    withUserContextLogger(
      winston,
      withInstallation(
        prisma,
        withSources(async (ctx) => {
          const owner = ctx.payload.sender.login.toLowerCase()
          const repo = ctx.payload.repository.name.toLowerCase()
          const config: LSCRepository | undefined =
            ctx.sources.config.repos[repo]
          const label = ((ctx.payload as any) as { label: GithubLabel }).label
          const issue = ctx.payload.issue

          ctx.logger.debug('IssueLabeled payload and config', {
            payload: ctx.payload,
            sources: ctx.sources.config,
          })

          ctx.logger.info(
            `Issue (${issue.number}) labeled with "${label.name}".`,
          )

          /* Ignore changes in non-strict config */
          /* istanbul ignore if */
          if (!config) {
            ctx.logger.info(`No configuration found, skipping.`)
            return
          }

          /* istanbul ignore if */
          if (!config.labels.hasOwnProperty(label.name)) {
            ctx.logger.info(`Unconfigured label "${label.name}", skipping.`)
            return
          }

          /* Find siblings. */
          const siblings = _.get(
            config,
            ['labels', label.name, 'siblings'],
            [] as string[],
          )
          const ghSiblings = siblings.map((sibling) => ({ name: sibling }))

          /* istanbul ignore if */
          if (ghSiblings.length === 0) {
            ctx.logger.info(`No siblings to add to "${label.name}", skipping.`)
            return
          }

          await addLabelsToIssue(
            ctx.github,
            { repo, owner, issue: issue.number },
            ghSiblings,
            true,
          )

          /* prettier-ignore */
          ctx.logger.info(`Added siblings of ${label.name} to issue ${issue.number}: ${siblings.join(', ')}`)
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
      winston,
      withInstallation(
        prisma,
        withSources(async (ctx) => {
          const owner = ctx.payload.sender.login.toLowerCase()
          const repo = ctx.payload.repository.name.toLowerCase()
          const config =
            ctx.sources.config.repos[repo] || ctx.sources.config.repos['*']

          ctx.logger.info(`New repository ${repo} in ${owner}.`)

          /* Ignore no configuration. */
          /* istanbul ignore if */
          if (!config) {
            ctx.logger.info(`No configuration, skipping sync.`)
            return
          }

          ctx.logger.info(`Performing sync on ${repo}.`)
          await handleLabelSync(ctx.github, owner, repo, config, true)
          ctx.logger.info(`Repository synced ${repo}.`)
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
    const owner = ctx.payload.sender.login.toLowerCase()
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
    const owner = ctx.payload.repository.owner.login.toLowerCase()
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
  logger: Logger,
  fn: (ctx: Context<C> & { logger: Logger }) => Promise<T>,
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

    const eventLogger = logger.child({
      event: {
        name: ctx.event,
        action: action,
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
      },
    })

    /**
     * Attach the current user context.
     * Run the event handler.
     * Remove the middleware.
     */
    try {
      ;(ctx as Context<C> & { logger: Logger }).logger = eventLogger
      return await fn(ctx as Context<C> & { logger: Logger })
    } catch (err) /* istanbul ignore next */ {
      /* Report the error and skip evaluation. */
      eventLogger.warn(`Event resulted in error.`, {
        meta: { error: err.message },
      })
      if (process.env.NODE_ENV !== 'production') console.error(err)
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
  logger: Logger,
  fn: (ctx: Context<C> & { logger: Logger }) => Promise<T>,
): (ctx: Context<C>) => Promise<T | undefined> {
  return async (ctx) => {
    const eventLogger = logger.child({
      event: {
        name: ctx.event,
      },
    })

    /**
     * Run the event handler.
     */
    try {
      ;(ctx as Context<C> & { logger: Logger }).logger = eventLogger
      return await fn(ctx as Context<C> & { logger: Logger })
    } catch (err) /* istanbul ignore next */ {
      /* Report the error and skip evaluation. */
      eventLogger.warn(`Event resulted in error.`, {
        meta: { error: err.message },
      })
      if (process.env.NODE_ENV !== 'production') console.error(err)
    }

    /* istanbul ignore next */
    return undefined
  }
}
