import { Plan } from '@prisma/client'
import ml from 'multilines'

import { Check } from '../parser'

// Constatnts

const NUMBER_OF_FREE_TIERS = 5

/**
 * Checks that the user has purchased the tier.
 */
export const checkPlan: (plan: Plan) => Check = (plan) => {
  const check: Check = (config) => {
    /* Data */
    const numberOfConfiguredRepos = Object.keys(config.repos).length

    switch (plan) {
      case 'FREE': {
        /**
         * Report too many configurations.
         */
        if (numberOfConfiguredRepos > NUMBER_OF_FREE_TIERS) {
          const report = ml`
          | Update your current plan to access all the features LabelSync offers.
          | Your current plan is limited to 5 repositories.
          `
          return { success: false, error: report }
        }

        /**
         * Report wildcard configuration.
         */
        if (Object.keys(config.repos).includes('*')) {
          const report = ml`
          | You are trying to configure a wildcard configuration on a free plan.
          | Update your current plan to access all the features LabelSync offers.
          `
          return { success: false, error: report }
        }

        break
      }
      case 'PAID': {
        /* No limits for purchased accounts. */
        break
      }
    }

    return { success: true, config }
  }

  return check
}
