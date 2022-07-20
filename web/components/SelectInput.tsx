/**
 * Lets you pick one of the options.
 */
export const SelectInput = <T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string
  label: string
  value: T
  options: { label: string; value: T }[]
  onChange: (val: T) => void
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        name={name}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition ease-in-out duration-150"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map(({ label, value }) => (
          <option key={label} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
