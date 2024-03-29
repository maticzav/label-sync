import React, { useState } from 'react'
import Link from 'next/link'
import { CSSTransition } from 'react-transition-group'

export interface Navigation {
  links: {
    label: string
    href: string
    onClick?: () => void
  }[]
}

export default function Navigation(props: Navigation) {
  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen(!open)
  }

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-6 sm:px-6 pt-6 pb-12 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
        {/* Desktop navigation */}
        <nav className="relative container flex items-center justify-between sm:h-10 md:justify-end">
          <div className="flex items-center flex-1 md:absolute md:inset-y-0 md:left-0">
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link href="/">
                <a>
                  <img
                    className="h-7 w-auto sm:h-8 text-red-300"
                    src="/img/logos/labelsync.svg"
                    alt="LabelSync Logo"
                  />
                </a>
              </Link>
              <div className="-mr-2 flex items-center md:hidden">
                <button
                  onClick={toggle}
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                >
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:block">
            {props.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={link.onClick}
                className="ml-10 font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition duration-150 ease-in-out"
              >
                {link.label}
              </a>
            ))}
          </div>
          {/*  */}
        </nav>
      </div>

      {/* Mobile navigation */}

      <div className="absolute top-0 inset-x-0 p-2 md:hidden">
        <div className="ease-in duration-700" style={{ display: open ? 'block' : 'none' }}>
          <div className="rounded-lg shadow-md transition transform origin-top-right">
            <div className="rounded-lg bg-white shadow-xs overflow-hidden">
              <div className="px-5 pt-4 flex items-center justify-between">
                <div>
                  <Link href="/">
                    <a>
                      <img
                        className="h-8 w-auto"
                        src="/img/logos/labelsync.svg"
                        alt="LabelSync Logo"
                      />
                    </a>
                  </Link>
                </div>
                <div className="-mr-2">
                  <button
                    type="button"
                    onClick={toggle}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                  >
                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="px-2 pt-2 pb-3">
                {props.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={link.onClick}
                    className="mt-1 block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              {/*  */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
