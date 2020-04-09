import Stripe from 'stripe'
// import { PrismaClient } from '@prisma/client'

export class Payments {
  client: Stripe
  endpointSecret: string

  constructor(apiKey: string, endpointSecret: string) {
    this.client = new Stripe(apiKey, {
      apiVersion: '2020-03-02',
    })
    this.endpointSecret = endpointSecret
    // this.db = prisma
  }

  // /**
  //  * Saves a purchase.
  //  */
  // async purchase(owner: string) {
  //   return this.db.purchase.create({})
  // }

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
  async getSession(owner: string) {
    return this.client.checkout.sessions.create({
      payment_method_types: ['card'],
      subscription_data: {
        items: [
          {
            plan: 'plan_H2NVZcTwOuqJkT',
          },
        ],
      },
      metadata: {
        owner: owner,
      },
      success_url: 'https://github.com/apps/labelsync-manager',
      cancel_url: 'https://label-sync.com',
    })
  }
}
