import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { loadStripe } from '@stripe/stripe-js'

import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { NOTION_DOCS_URL } from '../constants'

/* Stripe */

const stripeLoader = loadStripe(process.env.STRIPE_KEY!)

export const Subscribe = ({}) => {
  // Path
  const router = useRouter()

  let defaultPeriod: 'yearly' | 'monthly' = 'yearly'
  if (
    typeof router.query.period === 'string' && [
      'yearly',
      'monthly'.includes(router.query.period),
    ]
  ) {
    defaultPeriod = router.query.period as 'yearly' | 'monthly'
  }

  // Form

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [account, setAccount] = useState('')
  const [period, setPeriod] = useState<'yearly' | 'monthly'>(defaultPeriod)
  const [coupon, setCoupon] = useState('')
  const [agreed, setAgree] = useState(false)

  type Fetching =
    | { status: 'NOT_REQUESTED' }
    | { status: 'LOADING' }
    | { status: 'SUCCESS' }
    | { status: 'ERR'; message: string }

  const [fetching, setFetching] = useState<Fetching>({
    status: 'NOT_REQUESTED',
    // status: 'ERR',
    // message: 'Something went wrong.',
  })

  /**
   * Performs a call.
   */
  async function subscribe() {
    /* Required values */
    if (
      [email, firstName, lastName, account].some((val) => val.trim() === '')
    ) {
      setFetching({
        status: 'ERR',
        message: 'You must fill all the required fields.',
      })
      return
    }

    /* Terms of Service */
    if (!agreed) {
      setFetching({
        status: 'ERR',
        message:
          'You forgot to agree with Terms of Service and Privacy Policy.',
      })
      return
    }

    // Contact server
    setFetching({ status: 'LOADING' })

    try {
      const body = JSON.stringify({
        email,
        firstName,
        lastName,
        account,
        company,
        agreed,
        period,
        coupon,
      })

      const res = (await fetch(
        'https://webhook.label-sync.com/subscribe/session',
        {
          method: 'POST',
          mode: 'cors',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: body,
        },
      ).then((res) => res.json())) as
        | { status: 'ok'; session: string }
        | { status: 'err'; message: string }

      if (res.status === 'ok') {
        setFetching({ status: 'SUCCESS' })
        /* redirect to stripe */
        await stripeLoader
          .then((stripe) =>
            stripe!.redirectToCheckout({
              sessionId: res.session,
            }),
          )
          .catch((err) => console.log(err))
      } else {
        setFetching({ status: 'ERR', message: res.message })
      }
    } catch (err) {
      setFetching({ status: 'ERR', message: err.message })
    }
  }

  return (
    <>
      <title>Github LabelSync - Subscribe</title>

      {/* Navigation */}
      <div className="relative bg-gray-80">
        <div className="relative pt-6 pb-12 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
          <Navigation
            links={[
              {
                label: 'Documentation',
                href: NOTION_DOCS_URL,
              },
              {
                label: 'Install',
                href: 'https://github.com/apps/labelsync-manager',
              },

              {
                label: 'Support',
                href: 'mailto:support@labelsync.com',
              },
            ]}
          ></Navigation>
        </div>
      </div>

      {/* Form */}

      <div className="pt-2 pb-10 lg:pb-24 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">
              Subscribe to LabelSync
            </h2>
            <p className="mt-4 text-lg leading-6 text-gray-500">
              We'll redirect you to out payments provider after you complete the
              form below. Your subscription starts once you complete the
              purchase.
            </p>
          </div>

          {/* Form */}

          <div className="mt-12">
            <form
              action="#"
              onSubmit={subscribe}
              className="grid grid-cols-1 row-gap-6 sm:grid-cols-2 sm:col-gap-8"
            >
              {/* Subscriber info */}
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  First name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="first_name"
                    value={firstName}
                    required
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input py-3 px-4 block w-full transition ease-in-out duration-150"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  Last name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="last_name"
                    value={lastName}
                    required
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input py-3 px-4 block w-full transition ease-in-out duration-150"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="company"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  Company (only for companies)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="form-input py-3 px-4 block w-full transition ease-in-out duration-150"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input py-3 px-4 block w-full transition ease-in-out duration-150"
                  />
                </div>
              </div>

              {/* Github account */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="account"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  Github Account or Organisation
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    required
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    id="account"
                    className="form-input py-3 px-4 block w-full transition ease-in-out duration-150"
                  />
                </div>
              </div>

              {/* Period */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="period"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  Subscription Period
                </label>

                <div className="mt-1 relative rounded-md shadow-sm">
                  <select
                    value={period}
                    onChange={(e) =>
                      setPeriod(e.target.value as 'yearly' | 'monthly')
                    }
                    aria-label="Country"
                    className="form-select relative py-3 px-4 block w-full rounded-md bg-transparent focus:z-10 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                  >
                    <option value="yearly">Annualy</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Github account */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="coupon"
                  className="block text-sm font-medium leading-5 text-gray-700"
                >
                  Discount Coupon
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    required
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    id="coupon"
                    className="form-input py-3 px-4 block w-full transition ease-in-out duration-150"
                  />
                </div>
              </div>

              {/* Terms of Use */}

              <div className="sm:col-span-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {/*  */}
                    <span
                      onClick={() => setAgree(!agreed)}
                      className={
                        'relative inline-block flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline ' +
                        (agreed ? 'bg-green-400' : 'bg-gray-200')
                      }
                    >
                      {/* On: "translate-x-5", Off: "translate-x-0" */}
                      <span
                        className={
                          'inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 ' +
                          (agreed ? 'translate-x-5' : 'translate-x-0')
                        }
                      ></span>
                    </span>
                  </div>

                  <div className="ml-3">
                    <p className="text-base leading-6 text-gray-500">
                      By selecting this, you agree to the
                      <a
                        href="https://www.notion.so/LabelSync-s-Terms-of-Service-and-Privacy-Policy-cea6dddad9294eddb95a61fb361e5d2f"
                        className="font-medium ml-1 text-gray-700 underline"
                      >
                        Privacy Policy and Terms of Service
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="sm:col-span-2 mt-4">
                <span className="w-full inline-flex rounded-md shadow-sm">
                  <button
                    onClick={subscribe}
                    type="button"
                    disabled={fetching.status === 'LOADING'}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-indigo active:bg-green-700 transition ease-in-out duration-150"
                  >
                    Subscribe
                  </button>
                </span>
              </div>

              {/* Errors and messages */}
              <div className="sm:col-span-2">
                {fetching.status === 'ERR' && (
                  <div
                    className="p-2 bg-pink-800 items-center text-pink-100 leading-none rounded-full flex lg:inline-flex"
                    role="alert"
                  >
                    <span className="flex rounded-full bg-pink-500 uppercase px-2 py-1 text-xs font-bold mr-3">
                      Error
                    </span>
                    <span className="font-semibold mr-2 text-left flex-auto">
                      {fetching.message}
                    </span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer></Footer>
    </>
  )
}

export default Subscribe

/* Sections */
