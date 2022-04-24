import { PrismaClient } from '@prisma/client'
import { DateTime } from 'luxon'

import { prisma } from './prisma'

export enum CacheStrategy {
  // Only use cached value.
  CacheOnly,
  // Always fetch from the network.
  NetworkOnly,
  // If there's a value in the cache use it, otherwise fetch from the network.
  CacheFirst,
}

/**
 * Source implements an in-memory caching mechanism that should be extended
 * with an actual implementation for a given data-type.
 */
export abstract class Source<Key, Value extends { ttl: DateTime }> {
  /**
   * Internal representation of the cached data.
   */
  private cache: { [key: string]: Value } = {}

  /**
   * Timer that invalidates the cache.
   */
  private timer: NodeJS.Timeout | null = null

  /**
   * Queue of unsynced challenges.
   */
  private priority: ((self: Source<Key, Value>) => Promise<void>)[] = []
  private queue: ((self: Source<Key, Value>) => Promise<void>)[] = []

  /**
   * Number of currently running operations.
   */
  private locks: number = 0

  /**
   * Maximum number of concurrent functions.
   */
  private concurrency: number

  /**
   * Reference to the PrismaClient that may be used to connect to the database.
   */
  protected prisma: () => PrismaClient

  constructor(concurrency: number, timeout: number) {
    this.concurrency = concurrency
    this.clear = this.clear.bind(this)
    this.timer = setInterval(this.clear, timeout)
    this.prisma = prisma
  }

  /**
   * Goes through the cache and removes any expired entries.
   */
  private clear() {
    const time = DateTime.now()

    for (const key in this.cache) {
      const cached = this.cache[key]
      if (cached.ttl < time) {
        delete this.cache[key]
      }
    }
  }

  /**
   * Data gathering function that caches the intermidiate result.
   *
   * @param key The key to use for caching.
   * @param strategy The strategy to use for fetching the data.
   */
  async get(key: Key, strategy: CacheStrategy = CacheStrategy.CacheFirst): Promise<Value | null> {
    const id = this.identify(key)
    const cached = this.cache[id]
    if (cached && strategy !== CacheStrategy.NetworkOnly) {
      return cached
    }

    if (strategy === CacheStrategy.CacheOnly) {
      return null
    }

    const data = await this.fetch(key)
    if (data) {
      this.cache[id] = data
    }

    return data
  }

  /**
   * Gets the challenge with a given id from the database.
   */
  abstract fetch(key: Key): Promise<Value | null>

  /**
   * Returns a string that may be used as a cache key.
   */
  abstract identify(key: Key): string

  /**
   * Manually overrides the cache for a given key entry.
   */
  protected set(key: Key, value: Value): void {
    const id = this.identify(key)
    this.cache[id] = value
  }

  /**
   * Adds a task to the queue to be processed or executes it immediately
   * if the queue is empty.
   */
  protected enqueue(fn: (self: Source<Key, Value>) => Promise<void>): void {
    this.queue.push(fn)
    this.tick()
  }

  /**
   * Processes a single task and starts processing the next one
   * if the queue is not empty.
   */
  private tick(): void {
    while (this.locks < this.concurrency) {
      let priority = true
      let next = this.priority.shift()

      if (!next) {
        priority = false
        next = this.queue.shift()
      }

      if (!next) {
        break
      }

      this.locks++
      next(this)
        .catch((err) => {
          console.error(err)

          // Reexecute the task once if it failed in the priority queue.
          if (next && !priority) {
            this.priority.push(next)
          }
        })
        .finally(() => {
          this.locks--
          this.tick()
        })
    }
  }

  /**
   * Invalidates the cache and schedules a new fetch request.
   */
  protected invalidate(key: Key) {
    const id = this.identify(key)
    delete this.cache[id]
  }

  /**
   * Clears invalidation timer and the cache.
   */
  public dispose() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    this.cache = {}
  }
}
