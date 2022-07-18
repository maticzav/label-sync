import React, { useCallback } from 'react'
import classnames from 'classnames'

interface TableProps<T extends string> {
  header: string
  description: string
  columns: { label: string; key: T }[]
  data: ({ id: string } & { [P in T]?: string })[]
  onEdit?: (id: string) => void
}

/**
 * A component that presents data in a table.
 */
export function Table<T extends string>({
  header,
  description,
  columns,
  data,
  onEdit,
}: TableProps<T>) {
  const handleEdit = useCallback(
    (id: string) => {
      if (onEdit) {
        onEdit(id)
      }
    },
    [onEdit],
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">{header}</h1>
          <p className="mt-2 text-sm text-gray-700">{description}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                {/* Header */}
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column, i) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={classnames(
                          'py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900',
                          { 'sm:pl-6': i === 0 },
                        )}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Data */}
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.map((row) => (
                    <tr key={row.id}>
                      {columns.map((column, i) => (
                        <td
                          key={column.key}
                          className={classnames(
                            'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900',
                            { 'sm:pl-6': i === 0 },
                          )}
                        >
                          {row[column.key] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
