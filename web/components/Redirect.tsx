import Head from 'next/head'
import React from 'react'

/**
 * A placeholder component that may be showed on a page that redirects
 * somewhere else.
 */
export function Redirect({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col justify-center">
      <Head>
        <title>{title}</title>
      </Head>
      <img className="h-7 block mx-auto" src="/img/logos/labelsync.svg" alt="LabelSync Logo" />
    </div>
  )
}
