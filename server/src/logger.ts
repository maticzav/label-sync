import { PrismaClient } from '@prisma/client'

export interface LogContext {
  event: string
  owner: string
  repo?: string
}

export class Logger {
  private db: PrismaClient

  constructor(client: PrismaClient) {
    this.db = client
  }

  /**
   * Creates a debug log.
   */
  debug(ctx: LogContext, object: object, message: string) {
    return this.db.log.create({
      data: {
        event: ctx.event,
        type: 'DEBUG',
        message: message,
        data: JSON.stringify(object),
        owner: ctx.owner,
        repository: ctx.repo,
      },
    })
  }

  /**
   * Creates an information log.
   */
  info(ctx: LogContext, message: string) {
    return this.db.log.create({
      data: {
        event: ctx.event,
        type: 'INFO',
        message: message,
        owner: ctx.owner,
        repository: ctx.repo,
      },
    })
  }

  /**
   * Creates a warning log.
   */
  warn(ctx: LogContext, message: string) {
    /* istanbul ignore next */
    return this.db.log.create({
      data: {
        event: ctx.event,
        type: 'WARN',
        message: message,
        owner: ctx.owner,
        repository: ctx.repo,
      },
    })
  }
}
