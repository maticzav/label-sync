import React from 'react'
import App from 'next/app'
import Router from 'next/router'

import '../styles/index.css'

import * as gtag from '../lib/gtag'

Router.events.on('routeChangeComplete', (url) => gtag.pageview(url))

export default class MyApp extends App {
  componentDidMount() {
    gtag.init()
  }

  render() {
    const { Component, pageProps } = this.props
    return <Component {...pageProps} />
  }
}
