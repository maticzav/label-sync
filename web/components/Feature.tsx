import React, { ReactElement } from 'react'

export interface Feature {
  icon: ReactElement
  caption: string
  title: [string, string]
  description: ReactElement
  image: string
  alt: string
}

export function Left(props: Feature) {
  return (
    <div className="block mt-8 mx-auto max-w-screen-xl px-4 sm:mt-12 sm:px-6 md:mt-20 lg:grid lg:grid-cols-2 lg:gap-8 xl:mt-24">
      {/* Text */}
      <div className="sm:text-center md:max-w-2xl md:mx-auto lg:text-right">
        <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 sm:text-base lg:text-sm xl:text-base">
          {props.caption}
        </div>
        <h3 className="mt-1 text-3xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-4xl lg:text-4xl xl:text-5xl">
          {props.icon}

          {props.title[0]}
          <br />
          <span className="text-emerald-600">{props.title[1]}</span>
        </h3>
        <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
          {props.description}
        </p>
      </div>

      {/* Image */}

      <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:flex lg:items-center">
        <div className="relative mx-auto block w-full max-h-64 rounded-lg shadow-lg overflow-auto focus:outline-none focus:shadow-outline lg:max-w-md">
          <img
            className="w-full object-cover object-fill object-left-top"
            src={props.image}
            alt={props.alt}
          />
        </div>
      </div>
    </div>
  )
}

export function Right(props: Feature) {
  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-16 sm:px-6 md:mt-30 lg:grid lg:grid-cols-2 lg:grid-flow-col-dense lg:gap-8 xl:mt-40">
      {/* Text */}
      <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-start-2 lg:text-left">
        <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 sm:text-base lg:text-sm xl:text-base">
          {props.caption}
        </div>
        <h3 className="mt-1 text-3xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-4xl lg:text-4xl xl:text-5xl">
          {props.icon}
          {props.title[0]}
          <br />
          <span className="text-emerald-600 lg:ml-2">{props.title[1]}</span>
        </h3>
        <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
          {props.description}
        </p>
      </div>

      {/* Image */}

      <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:col-start-1 lg:mx-0 lg:flex lg:items-center">
        <div className="relative mx-auto block w-full max-h-64 rounded-lg shadow-lg overflow-auto focus:outline-none focus:shadow-outline lg:max-w-md">
          <img className="w-full object-cover object-left-top" src={props.image} alt={props.alt} />
        </div>
      </div>
    </div>
  )
}
