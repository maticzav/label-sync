import React from 'react'

import Navigation, { NavigationProps } from '../components/Navigation'
import Footer from '../components/Footer'

import { scrollToId } from '../lib/scroll'

/**
 * The base component for all pages on LabelSync website.
 */
export default function Page(props: React.PropsWithChildren<{}>) {
  const links: NavigationProps['links'] = [
    {
      label: 'Docs',
      link: '/docs',
    },
    {
      label: 'Install',
      href: 'https://github.com/apps/labelsync-manager',
    },
    {
      label: 'Pricing',
      href: '#',
      onClick: () => scrollToId('pricing'),
    },
    {
      label: 'Features',
      href: '#',
      onClick: () => scrollToId('features'),
    },
    {
      label: 'Support',
      link: '/support',
    },
  ]

  return (
    <div className="w-full">
      <div className="relative bg-gray-80 overflow-hidden">
        <div className="relative pt-6 pb-12 ">
          <Navigation links={links} />
        </div>
      </div>

      {/*  */}

      {props.children}

      {/*  */}

      <Footer />
    </div>
  )
}
