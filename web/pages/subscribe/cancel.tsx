import React from 'react'
import Link from 'next/link'

import Page from '../../components/Page'

/**
 * This is cancel page - the saddest website of them all. People should
 * start crying when they see it!
 */

export default function Cancel() {
  // MARK: - View
  return (
    <>
      <title>CryCry</title>
      <Page>
        <div className="w-full h-screen flex flex-col justify-center container">
          <Link href="/subscribe">
            <a>
              <img
                className="max-h-32 block mx-auto my-8"
                src="/img/gifs/sad.gif"
                alt="Sad sad"
              />
            </a>
          </Link>
        </div>
      </Page>
    </>
  )
}
