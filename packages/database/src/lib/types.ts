import { Plan } from '@prisma/client'
/**
 * Represents a single LabelSync installation in the database.
 */
export type Installation = {
  id: string

  account: string
  email: string | null

  plan: Plan
  periodEndsAt: Date

  activated: boolean
}

export { Plan }
