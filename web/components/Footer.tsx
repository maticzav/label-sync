import React from 'react'
import Link from 'next/link'

import { scrollToId } from '../lib/scroll'

// MARK: - Groups

const groups = [
  {
    name: 'Support',
    links: [
      {
        label: 'Documentation',
        link: '/docs',
      },
      {
        label: 'Pricing',
        href: '#',
        onClick: () => scrollToId('pricing'),
      },
      {
        label: 'Status',
        href: 'https://labelsync.statuspage.io',
      },
      {
        label: 'Support',
        href: 'mailto:support@labelsync.com',
      },
    ],
  },
  {
    name: 'Legal',
    links: [
      {
        label: 'Terms of Service',
        link: '/privacy',
      },
      {
        label: 'Privacy Policy',
        link: '/privacy',
      },
    ],
  },
]

/**
 * Renders the footer of the webpage. Footer is used as a component
 * inside Page component that wraps other pages used in LabelSync website.
 */

export default function Footer() {
  // MARK: - View

  return (
    <div className="bg-white">
      <div className="max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-2 xl:gap-8">
          {/* <!-- Upper footer --> */}

          <div className="xl:col-span-1">
            {/* <!-- Company --> */}

            <img
              className="h-10"
              src="/img/logos/labelsync.svg"
              alt="LabelSync"
            />
            <p className="mt-8 text-gray-500 text-base leading-6">
              Our vision is to develop the best in class software that would
              simplify the use of labels. If you want to get your labels under
              control, this is the right tool for you.
            </p>

            {/* <!-- Social networks --> */}

            <div className="mt-8 flex">
              <a
                href="https://twitter.com/maticzav"
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://github.com/maticzav/label-sync"
                className="ml-6 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* <!-- Links --> */}

          <div className="mt-12 grid grid-cols-2 gap-8 lg:w-1/2 xl:mt-0 xl:col-span-1">
            {/* Groups grid */}
            {groups.map((group) => (
              <div key={group.name}>
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  {group.name}
                </h4>
                <ul>
                  {group.links.map((link) => (
                    <URL key={link.label} {...link} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Rights */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base leading-6 text-gray-400">
            &copy; 2020 ZAUM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

// MARK: - Utilities

type URLProps = {
  label: string
  href?: string
  link?: string
  onClick?: () => void
}

/**
 * Renders the link to the page using given parameters.
 */
function URL(props: URLProps) {
  if (props.link) {
    return (
      <li className="mt-4">
        <Link href={props.link}>
          <a className="text-base leading-6 text-gray-500 hover:text-gray-900">
            {props.label}
          </a>
        </Link>
      </li>
    )
  }

  return (
    <li className="mt-4">
      <a
        href={props.href}
        onClick={props.onClick}
        className="text-base leading-6 text-gray-500 hover:text-gray-900"
      >
        {props.label}
      </a>
    </li>
  )
}
