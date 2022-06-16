import redis, { RedisClientType } from 'redis'

/**
 * A general purpose queue backed by Redis.
 */
export class Queue<Task extends object> {
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
   * Function that pushes a new task to the queue.
   */
  protected async push(task: Task) {
    await this.client.RPUSH(this.queue(), JSON.stringify(task))
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

      try {
        await fn(task)
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
