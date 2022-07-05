import crypto from 'crypto'
import redis, { RedisClientType } from 'redis'

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
  private client: RedisClientType

  /**
   * Tells whether the queue has stopped processing requests.
   */
  private disposed: boolean

  constructor(name: string, url: string) {
    this.name = name
    this.client = redis.createClient({ url })
    this.disposed = false
  }

  public async start(): Promise<void> {
    await this.client.connect()
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
    return `queue:members:${this.name}`
  }

  /**
   * Function that pushes a new task to the queue and returns
   * the task identifier.
   */
  protected async push(task: Omit<Task, 'id'>): Promise<string> {
    const id = crypto.randomUUID()
    const hydratedTask = { id, ...task }

    await Promise.all([
      this.client.RPUSH(this.queue(), JSON.stringify(hydratedTask)),
      this.client.SADD(this.members(), id),
    ])

    return id
  }

  /**
   * A function that waits for new task in the queue and forwards it
   * to the executor for processing.
   */
  protected async process(fn: (task: Task) => Promise<void>) {
    while (!this.disposed) {
      const rawtask = await this.client.BLPOP([this.queue()], 30)
      if (!rawtask) {
        continue
      }
      const task = JSON.parse(rawtask.element) as Task

      // If some of the task's dependencies haven't been processed yet,
      // process them first. The for loop is synchronous because the
      // task usually only depends on a few dependencies and it
      // doesn't add significant overhead to the processing.
      for (const dependencyId of task.dependsOn) {
        const unprocessed = await this.client.SISMEMBER(this.queue(), dependencyId)
        if (unprocessed) {
          this.push(task)
          return
        }
      }

      // We process the task and add it back to the queue in case
      // something went wrong.
      try {
        await fn(task)
        await this.client.SREM(this.members(), task.id)
      } catch {
        this.push(task)
      }
    }
  }

  /**
   * Disposes the client.
   */
  public async dispose() {
    this.disposed = true
    await this.client.disconnect()
  }
}
