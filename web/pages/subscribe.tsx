import { MailIcon, AtSymbolIcon, ReceiptTaxIcon } from '@heroicons/react/solid'
import { loadStripe } from '@stripe/stripe-js'
import classnames from 'classnames'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

import Navigation from 'components/Navigation'
import { SelectInput } from 'components/SelectInput'
import { TextInput } from 'components/TextInput'
import Footer from 'components/Footer'

import { NOTION_DOCS_URL, NOTION_SUPPORT_URL } from '../constants'
import { LoadingIndicator } from 'components/LoadingIndicator'

/* Stripe */

const stripeLoader = loadStripe(process.env.STRIPE_KEY!)

type Period = 'ANNUALLY' | 'MONTHLY'
type Plan = 'FREE' | 'PAID'

export default function Subscribe() {
  return (
    <>
      <title>Github LabelSync - Subscribe</title>

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
            href: NOTION_SUPPORT_URL,
          },
        ]}
      />

      <Form />
      <Footer />
    </>
  )
}

function Form() {
  const { query } = useRouter()

  const [email, setEmail] = useState('')
  const [account, setAccount] = useState('')
  const [cadence, setCadence] = useState<Period>('ANNUALLY')
  const [plan, setPlan] = useState<Plan>('PAID')
  const [coupon, setCoupon] = useState<string>('')

  useEffect(() => {
    /* Populate the form from the URL. */
    if (['FREE', 'PAID'].includes(query.plan as string)) {
      setPlan(query.plan as Plan)
    }
    if (['ANNUALLY', 'MONTHLY'].includes(query.period as string)) {
      setCadence(query.period as Period)
    }

    if (typeof query.email === 'string') {
      setEmail(query.email)
    }

    if (typeof query.account === 'string') {
      setAccount(query.account)
    }

    if (typeof query.coupon === 'string') {
      setCoupon(query.coupon)
    }
  }, [query])

  type Fetching =
    | { status: 'NOT_REQUESTED' }
    | { status: 'LOADING' }
    | { status: 'SUCCESS' }
    | { status: 'ERR'; message: string }

  const [fetching, setFetching] = useState<Fetching>({ status: 'NOT_REQUESTED' })

  /**
   * Function that performs the actual subscription.
   */
  const subscribe = useCallback(async () => {
    setFetching({ status: 'LOADING' })

    let body = JSON.stringify({ email, account, agreed: true, plan: 'FREE' })
    if (plan === 'PAID') {
      body = JSON.stringify({ email, account, plan: 'PAID', cadence, coupon })
    }

    try {
      const res:
        | { status: 'ok'; plan: 'FREE' }
        | { status: 'ok'; plan: 'PAID'; session: string }
        | { status: 'error'; message: string } = await fetch('/api/checkout/create', {
        method: 'POST',
        body: body,
      }).then((res) => res.json())

      if (res.status === 'error') {
        setFetching({ status: 'ERR', message: res.message })
        return
      }

      setFetching({ status: 'SUCCESS' })

      if (res.plan === 'FREE') {
        window.location.href = 'https://github.com/apps/labelsync-manager'
        return
      }

      if (!res.session) {
        setFetching({ status: 'ERR', message: 'Something went wrong... try again in a minute.' })
        return
      }

      // Redirect to Stripe for purchase.
      await stripeLoader
        .then((stripe) => stripe!.redirectToCheckout({ sessionId: res.session }))
        .catch((err) => console.log(err))
    } catch (err: any) {
      setFetching({ status: 'ERR', message: err.message })
    }
  }, [email, account, cadence, coupon, plan, setFetching])

  return (
    <div className="pt-2 pb-10 lg:pb-24 px-4 overflow-hidden sm:px-6 lg:px-8 mx-auto max-w-xl">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">
          Subscribe to LabelSync
        </h2>
        <p className="mt-4 text-lg leading-6 text-gray-500">
          If you are purchasing a paid plan we'll redirect you to our payments provider after you
          complete the form below. Your subscription starts once you complete the purchase.
        </p>
      </div>

      {/* Form */}

      <div className="mt-12">
        <form
          action="#"
          onSubmit={subscribe}
          className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-3"
        >
          <div className="col-span-2">
            <TextInput
              name="email"
              label="Email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              icon={MailIcon}
            />
          </div>

          <div className="col-span-2">
            <TextInput
              name="account"
              label="GitHub Account"
              type="text"
              placeholder="maticzav"
              value={account}
              onChange={setAccount}
              icon={AtSymbolIcon}
            />
          </div>

          <div
            className={classnames('col-span-2', {
              'sm:col-span-1': plan === 'PAID',
              'sm:col-span-2': plan === 'FREE',
            })}
          >
            <SelectInput
              name="plan"
              label="Subscription"
              options={[
                { label: 'Free', value: 'FREE' },
                { label: 'Paid', value: 'PAID' },
              ]}
              value={plan}
              onChange={setPlan}
            />
          </div>

          <div
            className="col-span-2 sm:col-span-1"
            style={{ display: plan === 'PAID' ? 'block' : 'none' }}
          >
            <SelectInput
              name="cadence"
              label="Cadence"
              options={[
                { label: 'Monthly', value: 'MONTHLY' },
                { label: 'Annually', value: 'ANNUALLY' },
              ]}
              value={cadence}
              onChange={setCadence}
            />
          </div>

          <div className="sm:col-span-2" style={{ display: plan === 'PAID' ? 'block' : 'none' }}>
            <TextInput
              name="coupon"
              label="Discount"
              type="text"
              placeholder="DISC10"
              value={coupon ?? ''}
              onChange={setCoupon}
              icon={ReceiptTaxIcon}
            />
          </div>

          <div className="col-span-2 mt-1">
            <Submit
              label={plan === 'PAID' ? 'Subscribe' : 'Install'}
              disabled={fetching.status === 'LOADING' || email === '' || account === ''}
              loading={fetching.status === 'LOADING'}
              onClick={subscribe}
            />

            {fetching.status === 'ERR' && (
              <p className="mt-2 text-sm text-red-600 mx-1">{fetching.message}</p>
            )}
          </div>

          <div className="sm:col-span-2 px-3">
            <TermsOfUse />
          </div>
        </form>

        {/*  */}
      </div>
    </div>
  )
}

function Submit({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick()
    }
  }, [onClick, disabled])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={classnames(
        `w-full inline-flex items-center justify-center px-6 py-3
        text-base leading-6 font-medium text-white
        border border-transparent rounded-md
        bg-emerald-600
        hover:bg-emerald-500
        focus:outline-none focus:border-emerald-700 focus:shadow-outline-indigo
        active:bg-emerald-700 active:scale-95
        transition ease-in-out duration-150`,
        {
          'scale-95 bg-gray-300 hover:bg-gray-200 active:bg-gray-300 active:scale-90': disabled,
        },
      )}
    >
      {loading && <LoadingIndicator />}
      {label}
    </button>
  )
}

function TermsOfUse() {
  return (
    <p className="text-base leading-6 text-gray-500">
      By clicking subscribe, you agree to the
      <a
        href="https://www.notion.so/LabelSync-s-Terms-of-Service-and-Privacy-Policy-cea6dddad9294eddb95a61fb361e5d2f"
        className="font-medium ml-1 text-gray-700 underline"
      >
        Privacy Policy and Terms of Service
      </a>
      .
    </p>
  )
}
