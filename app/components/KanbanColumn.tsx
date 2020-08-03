import React from 'react'
import {} from '@graywolfai/react-heroicons'

export interface KanbanColumnOptions {
  name: string
  label: {
    name: string
    color: string
  }
  count: number
}

export default function KanbanColumn(
  props: React.PropsWithChildren<KanbanColumnOptions>,
) {
  return (
    <div className="border-gray-200 border overflow-hidden w-min-content bg-white rounded-md shadow-md">
      {/* Header */}
      <div className="flex justify-between text-gray-700 bg-gray-50 border-b border-gray-200 py-3 px-4">
        <span className="text-md font-semibold">{props.name}</span>
        <span
          className="text-white text-sm font-semibold px-1 rounded-md"
          style={{ backgroundColor: props.label.color }}
        >
          {props.count}
        </span>
      </div>
      {/* Cards */}
      <div className="px-3 pb-3 pt-3">{props.children}</div>
    </div>
  )
}
