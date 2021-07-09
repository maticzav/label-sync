import React, { useState, useEffect } from 'react'
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next'
import { Head } from 'next/document'

import stripe from 'stripe'

import Page from '../../components/Page'

/**
 * Subscribe Webpage that lets customers start a LabelSync subscription.
 */

type SubscribeProps = {
  plans: []
}

function Subscribe(props: SubscribeProps) {
  // MARK: - View

  return (
    <>
      <title>Github LabelSync - Subscribe</title>

      <Page>
        {/* Headline */}

        <div className="pt-2 pb-10 lg:pb-24 px-4 overflow-hidden sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            {/* Heading */}
            <div className="text-center">
              <h2 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">
                Subscribe to LabelSync
              </h2>
              <p className="mt-4 text-lg leading-6 text-gray-500">
                Select a plan, sign-in and start using LabelSync. It only takes
                5 minutes!
              </p>
            </div>

            {/* Plans */}

            <div className="mt-12">
              {/* // *TODO: Create a form for each item. */}
              <form action="/create-checkout-session" method="POST">
                {/* <input type="hidden" name="item" value={item} /> */}
                <button type="submit">Checkout</button>
              </form>
            </div>

            {/*  */}
          </div>
        </div>
        {/*  */}
      </Page>
    </>
  )
}

export default Subscribe

// MARK: - Data Fetching

export const getServerSideProps: GetServerSideProps = async (context) => {
  const plans = stripe('')

  return {
    props: {},
  }
}
