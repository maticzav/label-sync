import crypto from 'crypto'
import * as redis from 'redis'

import type { Task } from '@labelsync/queues'
import { UnionOmit } from './utils'

/**
 * A general purpose queue backed by Redis.
 */
export class TaskQueue {
  /**
   * Name of the queue.
   */
  private name: string

  /**
   * Client to use for communication with the Redis queue.
   */
  private client: redis.RedisClientType

  private connected: boolean = false

  constructor({ name, url }: { name: string; url: string }) {
    this.name = name
    this.client = redis.createClient({ url })
  }

  /**
   * Starts the queue and connects to Redis.
   */
  public async start(): Promise<void> {
    if (!this.connected) {
      await this.client.connect()
    }
    this.connected = true
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

    await Promise.all([
      this.client.RPUSH(this.queue(), JSON.stringify({ id, ...task })),
      this.client.SADD(this.members(), id),
    ])

    return id
  }

  /**
   * Stops the server.
   */
  public async dispose() {
    await this.client.disconnect()
  }
}

/**
 * Shared task queue that may be references by multiple API endpoints.
 */
export const shared = new TaskQueue({
  name: 'tasks',
  url: process.env.REDIS_URL!,
})
