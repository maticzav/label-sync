/**
 * This is the file that probot uses to create an actual server.
 *
 * It's as bare bone as possible and untested.
 */

import { PrismaClient } from '@prisma/client'
import { Probot, Server } from 'probot'

import { Data } from './database'
import { Handler } from './event'
import * as events from './events'

// MARK: - Services

const prisma = new PrismaClient()

export const server = new Server({
  Probot: Probot.defaults({}),
  webhookPath: '/',
})

// MARK: - Sources

const database = new Data(prisma)

// MARK: - Main

server.load(async (app) => {
  /**
   * Migrate the data (i.e. sync the database with GitHub).
   */
  const auth = await app.auth()

  // auth.request

  /**
   * Load all the handlers from events folder.
   */
  const handlers: Handler[] = [
    events.installation,
    events.label,
    events.pullrequest,
    events.push,
    events.repository,
  ]

  for (const handler of handlers) {
    handler(app.on, {
      data: database,
    })
  }

  /**
   * Attach error handler.
   */
  app.onError((error) => {
    console.error(error.message)
  })
})

// Start

if (require.main == module) {
  server
    .start()
    .then(() => {
      console.log(`LabelSync up! 🚀`)
    })
    .catch((err) => {
      console.error(err)
    })
}
