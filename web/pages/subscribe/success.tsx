import React from 'react'
import Link from 'next/link'
import Reward, { RewardElement } from 'react-rewards'

import Page from '../../components/Page'
import { useRef } from 'react'
import { useEffect } from 'react'

/**
 * This is success page - the coolest website of them all.
 */

export default function Success() {
  const ref = useRef<RewardElement | null>(null)

  useEffect(() => {
    /**
     * Trigger confetti after 300ms.
     */
    setTimeout(() => {
      ref.current?.rewardMe()
    }, 1000)
  }, [])

  // MARK: - View

  return (
    <>
      <title>You are in!!!</title>

      <Page>
        <div className="w-full h-screen -mt-32 md:-mt-16 flex flex-col justify-center">
          <Reward
            ref={(_ref) => {
              ref.current = _ref
            }}
            type="confetti"
            config={{}}
          >
            <div className="w-full">
              <img
                className="max-h-36 md:max-h-48 block mx-auto my-8"
                src="/img/gifs/happy.gif"
                alt="Happy!"
              />
            </div>
          </Reward>

          {/* Links */}
          <div className="text-center mt-5 mb-10">
            <h2 className="inline-block text-xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-3xl underline-green">
              A few links that might be useful
            </h2>
          </div>

          <div className="mx-auto">
            <span className="relative z-0 inline-flex shadow-sm">
              {/* Installation Link */}
              <a
                href="https://github.com/apps/labelsync-manager"
                className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150"
              >
                Install
              </a>
              {/* Docs link */}
              <Link href="/docs">
                <a className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">
                  Documentation
                </a>
              </Link>
              {/* Home */}
              <Link href="/docs">
                <a className="-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">
                  Home
                </a>
              </Link>
            </span>
          </div>
        </div>
      </Page>
    </>
  )
}
