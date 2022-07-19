import pino from 'pino'

import { Task, TaskQueue } from '@labelsync/queues'

import { GitHubEndpoints } from './lib/github'
import { ExhaustiveSwitchCheck } from './lib/utils'
import { config } from './lib/env'
import { getOctokitForInstallation } from './lib/auth'
import { DryRunProcessor } from './processors/prDryRunProcessor'
import { OnboardingProcessor } from './processors/onboardingProcessor'
import { OrganizationSyncProcessor } from './processors/organizationSyncProcessor'
import { RepositorySyncProcessor } from './processors/repositorySyncProcessor'
import { SiblingsProcessor } from './processors/siblingsProcessor'
import { UnconfiguredLabelsProcessor } from './processors/unconfiguredLabelsProcessor'

/**
 * Class that processes tasks from the queue.
 */
export class Worker {
  /**
   * Database connection to the information about current sources.
   */
  private queue: TaskQueue

  /**
   * Central logger used to log events.
   */
  private logger: pino.Logger

  /**
   * Tells whether the worker has been stopped.
   */
  private disposed: boolean = false

  constructor() {
    this.tick = this.tick.bind(this)

    this.queue = new TaskQueue(config.redisUrl)
    this.logger = pino()
  }

  /**
   * Starts the syncer.
   */
  public async start() {
    await this.queue.start()

    this.queue.process(this.tick)
  }

  /**
   * Performs a single lookup and possible execution.
   */
  private async tick(task: Task): Promise<boolean> {
    this.logger.info(`New task "${task.kind}"!`)

    const octokit = getOctokitForInstallation(task.ghInstallationId)
    const endpoints = new GitHubEndpoints(octokit)
    const installation = { id: task.ghInstallationId }

    switch (task.kind) {
      case 'dryrun_config': {
        const processor = new DryRunProcessor(installation, this.queue, endpoints, this.logger)
        await processor.perform({
          owner: task.org,
          pr_number: task.pr_number,
          isPro: task.isPaidPlan,
        })
        break
      }

      case 'onboard_org': {
        const processor = new OnboardingProcessor(installation, this.queue, endpoints, this.logger)
        await processor.perform({ owner: task.org, accountType: task.accountType })
        break
      }

      case 'sync_org': {
        const processor = new OrganizationSyncProcessor(installation, this.queue, endpoints, this.logger)
        await processor.perform({ owner: task.org, isPro: task.isPaidPlan })
        break
      }

      case 'sync_repo': {
        const processor = new RepositorySyncProcessor(installation, this.queue, endpoints, this.logger)
        await processor.perform({ owner: task.org, repo: task.repo, isPro: task.isPaidPlan })
        break
      }

      case 'add_siblings': {
        const processor = new SiblingsProcessor(installation, this.queue, endpoints, this.logger)
        await processor.perform({
          owner: task.org,
          repo: task.repo,
          issue_number: task.issue_number,
          label: task.label,
          isPro: task.isPaidPlan,
        })
        break
      }

      case 'check_unconfigured_labels': {
        const processor = new UnconfiguredLabelsProcessor(installation, this.queue, endpoints, this.logger)
        await processor.perform({
          owner: task.org,
          repo: task.repo,
          label: task.label,
          isPro: task.isPaidPlan,
        })
        break
      }

      default:
        throw new ExhaustiveSwitchCheck(task)
    }

    return !this.disposed
  }

  /**
   * Stops the worker.
   */
  public async stop() {
    if (this.disposed) {
      return
    }

    this.disposed = true
    await this.queue.dispose()
  }
}
