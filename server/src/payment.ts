import { Period } from '@prisma/client'
import moment from 'moment'
import Stripe from 'stripe'

export class Payments {
  client: Stripe
  endpointSecret: string

  constructor(apiKey: string, endpointSecret: string) {
    this.client = new Stripe(apiKey, {
      apiVersion: '2020-03-02',
    })
    this.endpointSecret = endpointSecret
  }

  /**
   * Consturcts a purchase event.
   */
  async constructEvent(payload: string | Buffer, header: string | Buffer) {
    return this.client.webhooks.constructEvent(
      payload,
      header,
      this.endpointSecret,
    )
  }

  /**
   * Constructs a new checkout session.
   */
  async getSession(params: {
    ghAccount: string
    coupon: string
    period: Period
  }) {
    return this.client.checkout.sessions.create({
      payment_method_types: ['card'],
      subscription_data: {
        items: [this.getPlanForPeriod(params.period)],
        coupon: params.coupon,
      },
      metadata: {
        ghAccount: params.ghAccount,
        period: params.period,
      },
      success_url: 'https://github.com/apps/labelsync-manager',
      cancel_url: 'https://label-sync.com',
    })
  }

  /**
   * Turns a billing period into a plan.
   */
  getPlanForPeriod(period: Period): { plan: string } {
    switch (period) {
      case 'ANNUALLY': {
        return {
          plan: 'plan_HCkpZId8BCi7cI',
        }
      }
      case 'MONTHLY': {
        return {
          plan: 'plan_HCkojOBbK8hFh6',
        }
      }
    }
  }

  /**
   * Calculates expiration date based on billing period
   */
  getExpirationDateFromNow(period: Period): Date {
    const now = moment()

    switch (period) {
      case 'ANNUALLY': {
        return now.clone().add(1, 'year').toDate()
      }
      case 'MONTHLY': {
        return now.clone().add(1, 'month').toDate()
      }
    }
  }
}
