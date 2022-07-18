import React from 'react'
import Link from 'next/link'

export const Success = () => (
  <div className="w-full h-full flex flex-col justify-center bg-gray-100">
    {/* Text */}
    <div className="text-center container">
      <h1 className="font-semibold leading-1 text-4xl md:text-5xl text-emerald-500 my-3">
        Success! 🎉
      </h1>
    </div>

    {/* Image */}
    <img className="max-h-36 md:max-h-48 block mx-auto my-8" src="/img/success.svg" alt="Success" />
    {/* Links */}
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
)

export default Success
