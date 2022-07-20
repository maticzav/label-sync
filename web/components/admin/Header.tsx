import React from 'react'
import { UserButton } from '@clerk/nextjs'

/**
 * Component that should be used on authenticated pages as a header.
 */
export function Header() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img
                className="hidden lg:block h-8 w-auto"
                src="/img/logos/labelsync.svg"
                alt="LabelSync"
              />
              <img className="block lg:hidden h-8 w-auto" src="/img/logo.png" alt="LabelSync" />
            </div>
          </div>
          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
