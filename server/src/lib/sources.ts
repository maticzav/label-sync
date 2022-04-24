import { InstallationsSource } from '@labelsync/database'
import pino from 'pino'
import Stripe from 'stripe'

/**
 * Datasources shared by many components of the app.
 */
export type Sources = {
  installations: InstallationsSource
  stripe: Stripe
  log: pino.Logger
}
