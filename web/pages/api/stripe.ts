/* API */

/**
 * Handles request for subscription.
 */
api.post('/session', async (req, res) => {
  try {
    let { email, account, plan, agreed, period, coupon } = req.body as {
      [key: string]: string
    }

    /* istanbul ignore next */
    if ([email, account].some((val) => val.trim() === '')) {
      return res.send({
        status: 'err',
        message: 'Some fields are missing.',
      })
    }

    /* istanbul ignore next */
    if (!['PAID', 'FREE'].includes(plan)) {
      return res.send({
        status: 'err',
        message: `Invalid plan ${plan}.`,
      })
    }

    /* istanbul ignore next */
    if (plan === 'PAID' && !['MONTHLY', 'ANNUALLY'].includes(period)) {
      return res.send({
        status: 'err',
        message: `Invalid period for paid plan ${period}.`,
      })
    }

    /* Terms of Service */
    /* istanbul ignore next */
    if (!agreed) {
      return res.send({
        status: 'err',
        message: 'You must agree with Terms of Service and Privacy Policy.',
      })
    }

    /* Valid coupon */
    /* istanbul ignore next */
    if (
      coupon !== undefined &&
      (typeof coupon !== 'string' || coupon.trim() === '')
    ) {
      return res.send({
        status: 'err',
        message: 'Invalid coupon provided.',
      })
    }

    /* Unify account casing */
    account = account.toLowerCase()

    /**
     * People shouldn't be able to change purchase information afterwards.
     */
    const now = moment()
    await prisma.installation.upsert({
      where: { account },
      create: {
        account,
        email,
        plan: 'FREE',
        periodEndsAt: now.clone().add(3, 'years').toDate(),
        activated: false,
      },
      update: {},
    })

    switch (plan) {
      case 'FREE': {
        /* Return a successful request to redirect to installation. */
        return res.send({ status: 'ok', plan: 'FREE' })
      }
      case 'PAID': {
        /* Figure out the plan */
        let plan: string

        switch (period) {
          case 'MONTHLY':
          case 'ANNUALLY': {
            plan = plans[period as Period]
            break
          }
          /* istanbul ignore next */
          default: {
            throw new Error(`Unknown period ${period}.`)
          }
        }

        /* Create checkout session. */
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          subscription_data: {
            items: [{ plan }],
            metadata: {
              period,
              account,
            },
            coupon,
          },
          customer_email: email,
          expand: ['subscription'],
          success_url: 'https://label-sync.com/success',
          cancel_url: 'https://label-sync.com',
        })
        return res.send({ status: 'ok', plan: 'PAID', session: session.id })
      }
      /* istanbul ignore next */
      default: {
        throw new Error(`Unknown plan ${plan}.`)
      }
    }
  } catch (err) /* istanbul ignore next */ {
    winston.error(`Error in subscription flow: ${err.message}`)
    return res.send({ status: 'err', message: err.message })
  }
})

/* Stripe */

// const router = app.route('/stripe')

// router.post(
//   '/',
//   bodyParser.raw({ type: 'application/json' }),
//   async (req, res) => {
//     /**
//      * Stripe Webhook handler.
//      */
//     let event

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         req.headers['stripe-signature'] as string,
//         process.env.STRIPE_ENDPOINT_SECRET!,
//       )
//     } catch (err) /* istanbul ingore next */ {
//       winston.error(`Error in stripe webhook deconstruction.`, {
//         meta: {
//           error: err.message,
//         },
//       })
//       return res.status(400).send(`Webhook Error: ${err.message}`)
//     }

//     /* Logger */

//     winston.info(`Stripe event ${event.type}`, {
//       meta: {
//         payload: JSON.stringify(event.data.object),
//       },
//     })

//     /* Event handlers */

//     switch (event.type) {
//       /* Customer successfully subscribed to LabelSync */
//       case 'checkout.session.completed':
//       /* Customer paid an invoice */
//       case 'invoice.payment_succeeded': {
//         const payload = event.data.object as {
//           subscription: string
//         }

//         const sub = await stripe.subscriptions.retrieve(payload.subscription)

//         /* Calculate expiration date. */
//         const now = moment()
//         let expiresAt
//         switch (sub.metadata.period) {
//           case 'ANNUALLY': {
//             expiresAt = now.clone().add(1, 'year').add(3, 'day')
//             break
//           }
//           case 'MONTHLY': {
//             expiresAt = now.clone().add(1, 'month').add(3, 'day')
//             break
//           }
//           /* istanbul ingore next */
//           default: {
//             throw new Error(`Unknown period ${sub.metadata.period}`)
//           }
//         }

//         /* Update the installation in the database. */
//         const installation = await prisma.installation.update({
//           where: { account: sub.metadata.account },
//           data: {
//             plan: 'PAID',
//             periodEndsAt: expiresAt.toDate(),
//           },
//         })

//         winston.info(`New subscriber ${installation.account}`, {
//           meta: {
//             plan: 'PAID',
//             periodEndsAt: installation.periodEndsAt,
//           },
//         })

//         return res.json({ received: true })
//       }
//       /* istanbul ignore next */
//       default: {
//         winston.warn(`unhandled stripe webhook event: ${event.type}`)
//         return res.status(400).end()
//       }
//     }
//     /* End of Stripe Webhook handler */
//   },
// )
