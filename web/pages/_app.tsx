import React from 'react'
import { AppProps } from 'next/app'
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'

import '../styles/index.css'
import Head from 'next/head'

const PRIVATE_PAGES = ['/admin', '/admin/queue']

export default function MyApp({ Component, pageProps, router }: AppProps) {
  console.log(router.pathname)
  const isPublicPage = !PRIVATE_PAGES.includes(router.pathname)

  console.log({ isPublicPage })

  if (isPublicPage) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <Component {...pageProps} />
      </>
    )
  }

  return (
    <ClerkProvider {...pageProps}>
      <SignedIn>
        <Component {...pageProps} />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  )
}
