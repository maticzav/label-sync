import { DateTime } from 'luxon'
import pino from 'pino'

import { TasksSource } from '@labelsync/database'

type Configuration = {
  executor: {
    address: string
  }
  credentials: {
    bitQueryToken: string
    infuraKey: string
  }
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
  private tasks: TasksSource

  /**
   * Central logger used to log events.
   */
  private logger: pino.Logger

  constructor(config: Configuration) {
    this.tick = this.tick.bind(this)

    this.tasks = new TasksSource()
    this.logger = pino()

    this.timer = setInterval(this.tick, 10 * 1000)
  }

  /**
   * Performs a single lookup and possible execution.
   */
  private async tick() {
    this.logger.info(`Checking for new orders!`)
  }

  /**
   * Stops the watcher.
   */
  public stop() {
    this.tasks.dispose()

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
