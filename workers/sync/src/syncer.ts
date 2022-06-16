import pino from 'pino'

import { Task, TaskQueue } from '@labelsync/queues'

import { ExhaustiveSwitchCheck } from './lib/switch'
import { GitHubApp } from './lib/github/app'
import { GitHubEndpoints } from './lib/github/installation'

type Configuration = {
  redis: string
}

/**
 * Instance that watches the database for new tasks.
 */
export class Syncer {
  /**
   * Timer that checks the state on the blockchain.
   */
  private timer: NodeJS.Timeout | null = null

  /**
   * Database connection to the information about current sources.
   */
  private tasks: TaskQueue

  /**
   * Central logger used to log events.
   */
  private logger: pino.Logger

  private ghapp: GitHubApp

  private gh: GitHubEndpoints

  constructor(config: Configuration) {
    this.tick = this.tick.bind(this)

    this.tasks = new TaskQueue(config.redis)
    this.logger = pino()

    this.ghapp = new GitHubApp('id', 'key')
    this.gh = new GitHubEndpoints((installation) => this.ghapp.getInstallationToken(installation))

    this.tasks.process(this.tick)
  }

  /**
   * Starts the syncer.
   */
  public async start() {
    await this.tasks.start()
  }

  /**
   * Performs a single lookup and possible execution.
   */
  private async tick(task: Task) {
    this.logger.info(`New task "${task.kind}"!`)

    switch (task.kind) {
      case 'onboard':
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
        break
      case 'sync.issue':
        break
      case 'sync.repository':
        break
      default:
        throw new ExhaustiveSwitchCheck(task)
    }
  }

  /**
   * Stops the worker.
   */
  public async stop() {
    await this.tasks.dispose()

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
