import React, { ReactElement } from 'react'

export interface Testimonial {
  heading: string
  content: ReactElement
  image: string
  name: string
  role: string
  pattern?: boolean
  logo?: {
    name: string
    url: string
    image: string
  }
}

export default function Testimonial(props: Testimonial) {
  return (
    <>
      {/* <!-- Leading text --> */}

      <div className="text-center">
        <h2 className="inline-block text-2xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-4xl lg:text-4xl xl:text-4xl underline-green">
          {props.heading}
        </h2>
      </div>

      {/* mt-10 container mx-auto px-4 sm:px-6 lg:px-8 */}

      <div className="relative mt-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pattern */}
        {props.pattern && (
          <svg
            className="absolute top-full right-full transform translate-x-1/3 -translate-y-1/4 lg:translate-x-1/2 xl:-translate-y-1/2"
            width="404"
            height="404"
            fill="none"
            viewBox="0 0 404 404"
          >
            <defs>
              <pattern
                id="ad119f34-7694-4c31-947f-5c9d249b21f3"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect
              width="404"
              height="404"
              fill="url(#ad119f34-7694-4c31-947f-5c9d249b21f3)"
            />
          </svg>
        )}

        {/* <!-- Testimonial --> */}

        <div className="relative">
          {props.logo && (
            <a href={props.logo.url}>
              <img
                className="max-h-10 mx-auto"
                src={props.logo.image}
                alt={props.logo.name}
              />
            </a>
          )}

          <blockquote className={props.logo ? 'mt-8' : ''}>
            {/* Content */}
            <div className="max-w-3xl mx-auto text-center text-2xl leading-9 font-medium text-gray-900">
              {props.content}
            </div>

            {/* Speaker */}
            <footer className="mt-10">
              <div className="md:flex md:items-center md:justify-center">
                <div className="md:flex-shrink-0">
                  <img
                    className="mx-auto h-10 w-10 rounded-full"
                    src={props.image}
                    alt={props.name}
                  />
                </div>
                <div className="mt-3 text-center md:mt-0 md:ml-4 md:flex md:items-center">
                  <div className="text-base leading-6 font-medium text-gray-900">
                    {props.name}
                  </div>

                  <svg
                    className="hidden md:block mx-1 h-5 w-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11 0h3L9 20H6l5-20z" />
                  </svg>

                  <div className="text-base leading-6 font-medium text-gray-500">
                    {props.role}
                  </div>
                </div>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </>
  )
}
