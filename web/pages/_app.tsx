import React from 'react'
import { useState } from 'react'
import App, { AppProps } from 'next/app'
import Link from 'next/link'
import Router from 'next/router'

import '../styles/index.css'

import Banner from '../components/Banner'

import * as gtag from '../lib/gtag'

Router.events.on('routeChangeComplete', (url) => {
  gtag.pageview(url)
})

export default class MyApp extends App<{}, {}, {}> {
  constructor(props: AppProps) {
    super(props)
  }

  componentDidMount() {
    gtag.init()
    gtag.pageview(this.props.router.pathname)
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <>
        <Component {...pageProps} />
        <CookieBanner />
      </>
    )
  }
}

function CookieBanner(props: { onAccept?: () => void }) {
  const [accepted, setAccepted] = useState(false)

  if (accepted) {
    return null
  }

  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-20">
      <Banner
        message={
          <>
            By using LabelSync's services you agree to our
            <Link href="/privacy">
              <a className="ml-1 underline">Cookies Use</a>
            </Link>
            .
          </>
        }
        button={{
          text: 'Agree',
          onClick: () => setAccepted(true),
        }}
      ></Banner>
    </div>
  )
}
