import React from 'react'
import App, { AppProps } from 'next/app'
import Link from 'next/link'
import Router from 'next/router'

import '../styles/index.css'

import Banner from '../components/Banner'

import * as gtag from '../lib/gtag'

Router.events.on('routeChangeComplete', (url) => gtag.pageview(url))

interface State {
  acceptedCookies: boolean
}

export default class MyApp extends App<{}, {}, State> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      acceptedCookies: false,
    }
  }

  componentDidMount() {
    gtag.init()
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <>
        <Component {...pageProps} />
        {/* Cookie banner */}
        {!this.state.acceptedCookies && (
          <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5">
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
              shortMessage={
                <>
                  By using LabelSync you agree with our
                  <Link href="/privacy">
                    <a className="ml-1 underline">Cookies Use</a>
                  </Link>
                  .
                </>
              }
              button={{
                text: 'Agree',
                onClick: () => this.setState({ acceptedCookies: true }),
              }}
            ></Banner>
          </div>
        )}
      </>
    )
  }
}
