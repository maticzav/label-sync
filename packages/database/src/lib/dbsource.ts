import { PrismaClient } from '@prisma/client'
import { DateTime } from 'luxon'

import { getUnsafeGlobalClient } from './prisma'
import { Source } from './source'

export abstract class DatabaseSource<K, V extends { ttl: DateTime }> extends Source<K, V> {
  /**
   * Reference to the PrismaClient that may be used to connect to the database.
   */
  protected prisma: () => PrismaClient

  constructor(concurrency: number, timeout: number) {
    super(concurrency, timeout)
    this.prisma = getUnsafeGlobalClient
  }
}
