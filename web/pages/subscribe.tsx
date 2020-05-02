import React, { useState } from 'react'
import { useRouter } from 'next/router'

import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export const Subscribe = ({}) => {
  const router = useRouter()

  const [email, setEmail] = useState()

  return (
    <>
      <title>Github LabelSync - Subscribe</title>

      {/* Navigation */}
      <div className="relative bg-gray-80 overflow-hidden">
        <div className="relative pt-6 pb-12 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
          <Navigation
            links={[
              {
                label: 'Documentation',
                href:
                  'https://www.notion.so/LabelSync-Docs-7c004894c8994ecfbd9fb619d2417210',
              },

              {
                label: 'Support',
                href: 'mailto:support@labelsync.com',
              },
            ]}
          ></Navigation>
        </div>
      </div>

      {/* Form */}

      <div className="bg-gray-200">
        <div className="pt-12 container text-center px-10 sm:px-6 sm:pt-16 lg:pt-24">
          <p className="mt-2 text-3xl leading-9 font-extrabold text-green-500 sm:text-4xl sm:leading-10 lg:text-5xl lg:leading-none">
            Subscribe to LabelSync
          </p>
          <p className="mt-4 md:mt-6 text-xl mx-auto md:max-w-2xl leading-7 text-gray-200">
            We are also giving you an option for 14-day free trial to find out
            how the tool works and a free tier to see how great it is.
          </p>
        </div>
      </div>

      <Footer></Footer>
    </>
  )
}

export default Subscribe

/* Sections */
