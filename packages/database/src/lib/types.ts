import { Plan } from '@prisma/client'
import { DateTime } from 'luxon'
/**
 * Represents a single LabelSync installation in the database.
 */
export type Installation = {
  id: string

  account: string
  email: string | null

  plan: Plan
  periodEndsAt: DateTime

  activated: boolean
}

export { Plan }
