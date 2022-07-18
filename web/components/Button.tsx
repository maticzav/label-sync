import React, { PropsWithChildren } from 'react'

export interface Button {
  color?: string
  onClick?: () => void
  disabled?: boolean
}

/**
 * Simple Button component.
 */
export function Button(props: PropsWithChildren<Button>) {
  const color = props.color ?? 'gray'

  return (
    <div className="rounded-md shadow">
      <button
        className={`w-full flex items-center justify-center px-5 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-${color}-900 hover:bg-${color}-800 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out`}
        onClick={props.onClick}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    </div>
  )
}
