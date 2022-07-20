import Stripe from 'stripe'

export const PLAN_IDS = {
  MONTHLY: process.env.STRIPE_MONTHLY_ID!,
  ANNUALLY: process.env.STRIPE_ANNUAL_ID!,
}

/**
 * Async function that returns information about the price of a plan.
 */
export async function getPlanPrice(id: keyof typeof PLAN_IDS): Promise<{ monthly_amount: number }> {
  const plan_id = PLAN_IDS[id]
  const price = await stripe.prices.retrieve(plan_id)

  const amount = (price.unit_amount ?? 0) / 100
  const cadence = getNoOfMonths(price.recurring?.interval_count!, price.recurring?.interval!)

  return {
    monthly_amount: amount / cadence,
  }
}

function getNoOfMonths(n: number, cadence: Stripe.Plan.Interval): number {
  switch (cadence) {
    case 'month':
      return n
    case 'year':
      return n * 12
    case 'week':
      return 1
    case 'day':
      return 1
  }
}

/**
 * Shared instance of the Stripe client.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2020-08-27',
})
