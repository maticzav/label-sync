import type { NextApiRequest, NextApiResponse } from 'next'
import * as z from 'zod'

import { PLAN_IDS, stripe } from 'lib/checkout'

const schema = z.object({
  email: z.string().trim().min(3),
  account: z
    .string()
    .trim()
    .min(1)
    .transform((v) => v.toLowerCase()),
  plan: z.enum(['FREE', 'PAID']),
  cadence: z.enum(['MONTHLY', 'ANNUALLY']),
  coupon: z.string(),
})

/**
 * API endpoint that creates a Stripe checkout session.
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const body = schema.safeParse(JSON.parse(req.body))

  if (!body.success) {
    res.status(400).json({ message: body.error })
    return
  }

  const data = body.data

  if (data.plan === 'FREE') {
    res.send({ status: 'ok', plan: 'FREE' })
    return
  }

  const planId = PLAN_IDS[data.cadence]

  if (!planId) {
    res.status(400).send({ status: 'error', message: 'Invalid cadence...' })
    return
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      subscription_data: {
        items: [{ plan: planId }],
        metadata: { cadence: data.cadence, account: data.account },
        coupon: data.coupon.trim() === '' ? undefined : data.coupon,
      },
      customer_email: data.email,
      expand: ['subscription'],
      success_url: 'https://label-sync.com/success',
      cancel_url: 'https://label-sync.com',
    })

    res.status(200).json({ status: 'ok', plan: 'PAID', session: session.id })
  } catch (err: any) {
    res.status(400).json({ status: 'err', message: err.message })

    console.error(`Error in subscription flow: ${err.message}`)
  }
}
