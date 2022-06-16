import { InstallationsSource } from '@labelsync/database'
import { TaskQueue } from '@labelsync/queues'
import pino from 'pino'
import Stripe from 'stripe'

/**
 * Datasources shared by many components of the app.
 */
export type Sources = {
  installations: InstallationsSource
  tasks: TaskQueue
  stripe: Stripe
  log: pino.Logger
}
