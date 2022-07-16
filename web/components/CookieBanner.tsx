import React, { useState } from 'react'
import Link from 'next/link'

import Banner from './Banner'

export function CookieBanner(props: { onAccept?: () => void }) {
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
