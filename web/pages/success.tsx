import React from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

import Link from 'next/link'

export default function Success() {
  const { width, height } = useWindowSize(1920, 1080)

  console.log({ width, height })

  return (
    <div className="w-full h-full flex flex-col justify-center bg-gray-50">
      <div className="absolute w-full h-full top-0 left-0">
        <Confetti width={width} height={height} />
      </div>

      <img className="max-h-16 md:max-h-24 block mx-auto my-8" src="/img/logos/labelsync.svg" alt="Success" />

      <div className="mx-auto">
        <span className="relative z-0 inline-flex shadow-sm">
          <Link href="/" passHref>
            <Pill label="Home" />
          </Link>

          <Link href="/docs" passHref>
            <Pill label="Quick Start" />
          </Link>

          <Link href="/docs" passHref>
            <Pill label="Documentation" />
          </Link>

          <Pill label="Install" href="https://github.com/apps/labelsync-manager" />
        </span>
      </div>
    </div>
  )
}

function Pill({ label, href }: { href?: string; label: string }) {
  return (
    <a
      href={href}
      className="-ml-px first:ml-0 relative inline-flex items-center px-4 py-2 first:rounded-l-md last:rounded-r-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150"
    >
      {label}
    </a>
  )
}
