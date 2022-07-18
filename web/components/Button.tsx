import React, { PropsWithChildren } from 'react'

export interface Button {}

/**
 * Simple Button component.
 */
export function Button(props: PropsWithChildren<Button>) {
  return (
    <div className="rounded-md shadow">
      <button className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out">
        {props.children}
      </button>
    </div>
  )
}
