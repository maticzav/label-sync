import React from 'react'
import { ClockOutline } from '@graywolfai/react-heroicons'
import { Moment } from 'moment'

export interface IssueOptions {
  subject: string
  number: number
  date: Moment
  repository: string
  link: string
  labels: {
    label: string
    color: string
  }[]
  author: {
    name: string
    picture: string
  }
}

export default function Issue(props: IssueOptions) {
  return (
    <div className="border-gray-200 border w-72 overflow-hidden bg-white rounded-md shadow-md">
      {/* Subject */}
      <div className="text-gray-700 font-semibold text-md px-5 pt-3 pb-2">
        {props.subject}
      </div>
      {/* Labels */}
      <div className="px-5 py-1">
        {props.labels.map((label) => (
          <span
            key={label.label}
            className="p-1 rounded-sm text-xs font-semibold text-white mr-1"
            style={{ backgroundColor: label.color }}
          >
            {label.label}
          </span>
        ))}
        <img
          className="inline-block h-5 w-5 ml-2 rounded-full"
          aria-label={props.author.name}
          src={props.author.picture}
        />
      </div>
      {/* Time */}
      <div className="text-gray-400 font-light px-5 py-2">
        <ClockOutline className="inline-block h-5 w-5" />
        <span className="ml-2 text-xs">
          {props.date.startOf('hour').fromNow()}
        </span>
      </div>
      {/* Link */}
      <div className="bg-gray-100 border-t border-gray-200 px-6 py-2">
        <img
          className="inline-block h-3 w-3 rounded-full"
          src="/img/github.png"
        />
        <a
          className="underline font-light text-sm ml-2"
          href={props.link}
        >{`${props.repository}/issue#${props.number}`}</a>
      </div>
    </div>
  )
}
