import React from 'react'
import App, { AppProps } from 'next/app'

import '../styles/index.css'

export default class MyApp extends App<{}, {}, {}> {
  constructor(props: AppProps) {
    super(props)
  }

  render() {
    const { Component, pageProps } = this.props
    return <Component {...pageProps} />
  }
}
