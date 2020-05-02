import React, { ReactElement } from 'react'

export interface Tier {
  name: string
  description: string
  /* Current price */
  price: ReactElement

  features: {
    name: string
  }[]
  link: ReactElement
}

export default function Tier(props: Tier) {
  return (
    <div className="relative bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="px-6 py-8 sm:p-10 sm:pb-6">
        <div>
          <span className="inline-flex px-4 py-1 rounded-full text-sm leading-5 font-semibold tracking-wide uppercase bg-teal-100 text-teal-600">
            {props.name}
          </span>
        </div>
        <div className="mt-4 flex items-baseline text-6xl leading-none font-extrabold">
          {props.price}
        </div>
        <p className="mt-5 text-lg leading-7 text-gray-500">
          {props.description}
        </p>
      </div>

      <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
        <ul>
          {props.features.map((feature, i) => (
            <li
              key={feature.name}
              // skip top margin in first item
              className={i === 0 ? 'flex items-start' : 'mt-4 flex items-start'}
            >
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-500"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="ml-3 text-base leading-6 text-gray-700">
                {feature.name}
              </p>
            </li>
          ))}
        </ul>

        {/* <!-- Purchase --> */}
        <div className="mt-6">{props.link}</div>

        {/* <!--  --> */}
      </div>
      {/*  */}
    </div>
  )
}
