import React from 'react'

/**
 * Component that lets you accept text input.
 */
export const TextInput = ({
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
}: {
  name: string
  type: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  icon: (props: React.ComponentProps<'svg'>) => JSX.Element
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type={type}
          name={name}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md transition ease-in-out duration-150"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
