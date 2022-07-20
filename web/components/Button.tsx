import React, { PropsWithChildren } from 'react'

export interface Button {
  onClick?: () => void
  disabled?: boolean
}

/**
 * Simple Button component.
 */
export function Button(props: PropsWithChildren<Button>) {
  return (
    <div className="rounded-md shadow">
      <button
        className={`w-full flex items-center justify-center px-5 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 hover:scale-95 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out`}
        onClick={props.onClick}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    </div>
  )
}
