import {
  ArchiveOutline,
  MenuOutline,
  TagOutline,
  XOutline,
  TemplateOutline,
} from '@graywolfai/react-heroicons'
import Link from 'next/link'
import React, { useState } from 'react'
import { Transition } from './Transition'

const pages = [
  {
    slug: 'labels',
    label: 'Labels',
    icon: TagOutline,
    href: '/index',
  },
  {
    slug: 'kanban',
    label: 'Kanban',
    icon: TemplateOutline,
    href: '/kanban',
  },
  {
    slug: 'docs',
    label: 'Documentation',
    icon: ArchiveOutline,
    href: '/docs',
  },
]

/**
 * Represents the navigation wrapper for all pages.
 */
export default function Navigation(
  props: React.PropsWithChildren<{
    user: {
      name: string
      picture: string
    }
    page: string
  }>,
) {
  /* Sidebar on mobile toggle. */
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Off-canvas menu for mobile */}
      <div
        className="md:hidden"
        style={{ display: overlayVisible ? 'block' : 'none' }}
      >
        <div className="fixed inset-0 flex z-40">
          {/* Off-canvas menu overlay, show/hide based on off-canvas menu state. */}
          <Transition
            in={sidebarOpen}
            timeout={300}
            classNames={{
              inactive: 'opacity-0',
              transitioning: 'transition-opacity ease-linear duration-300',
              active: 'opacity-100',
            }}
            onEntering={() => setOverlayVisible(true)}
            onExited={() => setOverlayVisible(false)}
          >
            <div className="fixed inset-0">
              <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
            </div>
          </Transition>
          {/*
          Off-canvas menu, show/hide based on off-canvas menu state.

          Entering: "transition ease-in-out duration-300 transform"
            From: "-translate-x-full"
            To: "translate-x-0"
          Leaving: "transition ease-in-out duration-300 transform"
            From: "translate-x-0"
            To: "-translate-x-full"
          */}
          <Transition
            in={sidebarOpen}
            timeout={300}
            classNames={{
              inactive: '-translate-x-full transform',
              transitioning: 'transition ease-in-out duration-300 transform',
              active: 'translate-x-0 transform',
            }}
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              {/* Close button */}
              <div className="absolute top-0 right-0 -mr-14 p-1">
                <button
                  className="flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600"
                  aria-label="Close sidebar"
                  onClick={() => setSidebarOpen(false)}
                >
                  <XOutline className="h-6 w-6 text-white"></XOutline>
                </button>
              </div>
              {/* Navigation */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <img
                    className="h-8 w-auto"
                    src="/img/labelsync.svg"
                    alt="LabelSync"
                  />
                </div>
                <nav className="mt-5 px-2">
                  {pages.map((page) => (
                    <SidebarElement
                      key={page.slug}
                      active={page.slug === props.page}
                      size="small"
                      {...page}
                    ></SidebarElement>
                  ))}
                </nav>
              </div>

              {/* Profile */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <span className="flex-shrink-0 group block focus:outline-none">
                  <div className="flex items-center">
                    <div>
                      <img
                        className="inline-block h-10 w-10 rounded-full"
                        src={props.user.picture}
                        alt="Profile picture"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-base leading-6 font-medium text-gray-700 group-hover:text-gray-900">
                        {props.user.name}
                      </p>
                      <Link href="/logout">
                        <a className="block text-sm leading-5 font-medium text-gray-500 group-hover:text-gray-700 group-focus:underline transition ease-in-out duration-150">
                          Logout
                        </a>
                      </Link>
                    </div>
                  </div>
                </span>
              </div>
            </div>
          </Transition>
          <div className="flex-shrink-0 w-14">
            {/* <!-- Force sidebar to shrink to fit close icon --> */}
          </div>
        </div>
      </div>

      {/* <!-- Static sidebar for desktop --> */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img
                className="h-8 w-auto"
                src="/img/labelsync.svg"
                alt="LabelSync"
              />
            </div>

            {/* Sidebar component */}
            <nav className="mt-5 flex-1 px-2 bg-white">
              {pages.map((page) => (
                <SidebarElement
                  key={page.slug}
                  active={page.slug === props.page}
                  size="regular"
                  {...page}
                ></SidebarElement>
              ))}
            </nav>
          </div>

          {/* Profile */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <span className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={props.user.picture}
                    alt="Profile picture"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm leading-5 font-medium text-gray-700 group-hover:text-gray-900">
                    {props.user.name}
                  </p>
                  <Link href="/logout">
                    <a className="block text-xs leading-4 font-medium text-gray-500 group-hover:text-gray-700 transition ease-in-out duration-150">
                      Logout
                    </a>
                  </Link>
                </div>
              </div>
            </span>
            {/*  */}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Sidebar button */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:bg-gray-200 transition ease-in-out duration-150"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuOutline className="h-6 w-6"></MenuOutline>
          </button>
        </div>

        {/* Main view */}
        <main className="flex-1 relative z-0 overflow-y-auto bg-gray-50">
          {props.children}
        </main>
      </div>
    </div>
  )
}

/**
 * Represents a sidebar navigation link.
 */
function SidebarElement(props: {
  label: string
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
  href: string
  active: boolean
  size: 'small' | 'regular'
}) {
  let linkstyle: string
  if (props.active) {
    linkstyle =
      'my-1 group flex items-center px-2 py-2 text-base leading-6 font-medium text-gray-900 rounded-md bg-gray-100 focus:outline-none focus:bg-gray-200 transition ease-in-out duration-150'
  } else {
    linkstyle =
      'my-1 group flex items-center px-2 py-2 text-sm leading-5 font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:bg-gray-100 transition ease-in-out duration-150'
  }

  let iconstyle: string
  switch (props.size) {
    case 'small': {
      iconstyle =
        'mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500 transition ease-in-out duration-150'
      break
    }
    case 'regular': {
      iconstyle =
        'mr-4 h-6 w-6 text-gray-500 group-hover:text-gray-500 group-focus:text-gray-600 transition ease-in-out duration-150'
      break
    }
  }

  return (
    <Link href={props.href}>
      <a className={linkstyle}>
        <props.icon className={iconstyle}></props.icon>
        {props.label}
      </a>
    </Link>
  )
}
