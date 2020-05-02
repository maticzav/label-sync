import React from 'react'

export interface Picker<T extends string> {
  options: T[]
  value: T
  onChange: (val: T) => void
}

export default function Picker<T extends string>(props: Picker<T>) {
  return (
    <div className="p-2 bg-indigo-800 items-center text-indigo-100 leading-none lg:rounded-full flex lg:inline-flex">
      {props.options.map((option) => {
        return (
          <span
            key={option}
            className="flex rounded-full uppercase px-2 py-1 text-xs font-bold"
          >
            {option}
          </span>
        )
      })}
      <span className="flex rounded-full bg-indigo-500 uppercase px-2 py-1 text-xs font-bold mr-3">
        Yearly
      </span>
    </div>
  )
}
