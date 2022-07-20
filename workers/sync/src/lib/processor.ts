import { ITaskQueue } from '@labelsync/queues'
import pino from 'pino'

import { IGitHubEndpoints } from './github'

/**
 * A blueprint specification for a task processor that all processors
 * should extend. It provides base functionality for the processor.
 */
export class Processor<T> {
  protected installation: { id: number }

  /**
   * Available GitHub methods to communicate with the API.
   */
  protected endpoints: IGitHubEndpoints

  /**
   * A general logger that may be used to log significant events
   * that occur during execution.
   */
  protected log: pino.Logger

  /**
   * A queue that lets you push new tasks to the queue.
   */
  protected queue: Pick<ITaskQueue, 'push'>

  constructor(
    installation: { id: number },
    queue: Pick<ITaskQueue, 'push'>,
    endpoints: IGitHubEndpoints,
    logger: pino.Logger,
  ) {
    this.endpoints = endpoints
    this.installation = installation
    this.log = logger
    this.queue = queue
  }

  /**
   * Performs the current task and returns new tasks to be executed.
   */
  perform(data: T): Promise<void> {
    throw new Error(`Missing perform implementation in processor.`)
  }
}
