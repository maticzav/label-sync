import { Application } from 'probot'

/**
 * Probot webhook.
 */
export default (app: Application) => {
  app.on('push', async context => {})
}
