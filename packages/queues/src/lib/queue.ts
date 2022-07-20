import crypto from 'crypto'
import pino from 'pino'
import * as redis from 'redis'

import { sleep, UnionOmit } from './utils'

/**
 * The base type to use to build a new task.
 */
export type TaskSpec = {
  id: string

  /**
   * IDs of other tasks this task depends on.
   *
   * NOTE: If any of the tasks in this array is still in the queue,
   *       the system is going to put this task to the back of the queue again.
   */
  dependsOn: string[]
}

/**
 * A general purpose queue backed by Redis.
 */
export class Queue<Task extends TaskSpec> {
  /**
   * Name of the queue.
   */
  private name: string

  /**
   * Client to use for communication with the Redis queue.
   */
  private client: redis.RedisClientType

  /**
   * An intenral logger that the queue may use to log events.
   */
  private logger: pino.Logger

  /**
   * Number of functions that are currently processing tasks.
   */
  private locks: number = 0

  /**
   * Tells whether the queue has stopped processing requests.
   */
  private disposed: boolean = false

  /**
   * Functions that should be called when the queue is successfully disposed.
   */
  private releases: (() => void)[] = []

  private connected: boolean = false

  constructor(name: string, url: string) {
    this.name = name
    this.logger = pino()

    this.logger.info(`Connecting to Redis at "${url}"!`)

    this.client = redis.createClient({ url })
    this.client.on('error', (err) => this.logger.error(err, 'Redis Client Error'))
  }

  /**
   * Starts the queue and connects to Redis.
   */
  public async start(): Promise<void> {
    this.logger.info(`Connecting to queue "${this.name}"...`)
    if (!this.connected) {
      await this.client.connect()
    }
    this.connected = true
    this.logger.info(`Connected to queue "${this.name}"!`)
  }

  /**
   * Returns the list identifier for the queue.
   */
  private queue(): string {
    return `queue:${this.name}`
  }

  /**
   * Returns the name of the set used to list unprocessed tasks.
   */
  private members(): string {
    return `queuemembers:${this.name}`
  }

  /**
   * Lists all tasks that are currently in the queue.
   */
  public async list(): Promise<Task[]> {
    if (!this.connected) {
      await this.start()
    }

    this.logger.info(`Listing tasks in queue "${this.name}"!`)

    const rawtasks = await this.client.LRANGE(this.queue(), 0, -1)
    const tasks = rawtasks.map((raw) => JSON.parse(raw) as Task)

    return tasks
  }

  /**
   * Function that pushes a new task to the queue and returns
   * the task identifier.
   */
  public async push(task: UnionOmit<Task, 'id'>): Promise<string> {
    if (!this.connected) {
      await this.start()
    }

    const id = crypto.randomUUID()
    const hydratedTask = { id, ...task } as Task

    return this._push(hydratedTask)
  }

  /**
   * Adds a complete task to the queue.
   */
  private async _push(task: Task): Promise<string> {
    this.logger.info(task, `Pushing task "${task.id}" to queue "${this.name}"!`)

    await Promise.all([
      this.client.RPUSH(this.queue(), JSON.stringify(task)),
      this.client.SADD(this.members(), task.id),
    ])

    return task.id
  }

  /**
   * A function that waits for new task in the queue and forwards it
   * to the executor for processing.
   */
  public async process(fn: (task: Task) => Promise<boolean>) {
    if (!this.connected) {
      await this.start()
    }

    processor: while (!this.disposed) {
      this.logger.info(`Checking for new task in queue "${this.name}"!`)

      const rawtask = await this.client.BLPOP([this.queue()], 30)
      if (!rawtask) {
        if (!this.disposed) {
          await sleep(100)
          continue
        }

        // If we're disposed, we're done and stop processing tasks.
        return
      }
      const task = JSON.parse(rawtask.element) as Task

      // If some of the task's dependencies haven't been processed yet,
      // process them first. The for loop is synchronous because the
      // task usually only depends on a few dependencies and it
      // doesn't add significant overhead to the processing.
      for (const dependencyId of task.dependsOn) {
        const unprocessed = await this.client.SISMEMBER(this.members(), dependencyId)
        if (unprocessed) {
          await this._push(task)
          continue processor
        }
      }

      // We process the task and add it back to the queue in case
      // something went wrong.
      try {
        this.locks++
        const more = await fn(task)
        await this.client.SREM(this.members(), task.id)
        this.locks--

        await this._dispose()

        if (!more || this.disposed) {
          return
        }
      } catch {
        await this._push(task)
      }
    }
  }

  /**
   * Intenal utility function that disposes the client.
   */
  private async _dispose() {
    if (this.locks > 0 || !this.disposed) {
      return
    }

    await this.client.disconnect()
    this.locks = -1
    for (const release of this.releases) {
      release()
    }
  }

  /**
   * Disposes the client and returns a promise that resolves when
   * the connection is dropped.
   */
  public async dispose(): Promise<void> {
    this.disposed = true

    if (this.locks > 0) {
      return new Promise<void>((resolve) => {
        this.releases.push(resolve)
      })
    }

    await this._dispose()

    return
  }
}
