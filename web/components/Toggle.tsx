import classNames from 'classnames'

/**
 * A horizontal component that lets you switch between two states.
 */
export function Toggle({
  isOn,
  onClick,
  options,
}: {
  isOn: boolean
  onClick: () => void
  options: { on: string; off: string }
}) {
  return (
    <div className="mx-auto flex justify-center">
      <span className="mr-3 text-gray-200 font-semibold align-baseline">{options.off}</span>
      <ToggleSwitch isOn={isOn} onClick={onClick} />
      <span className="align-baseline font-semibold ml-3 text-gray-200">{options.on}</span>
    </div>
  )
}

/**
 * A component that shows a toggle switch button.
 */
export function ToggleSwitch({ isOn, onClick }: { isOn: boolean; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      className={classNames(
        'relative inline-block flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline',
        { 'bg-emerald-400': isOn, 'bg-gray-300': !isOn },
      )}
    >
      <span
        className={classNames(
          'inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200',
          { 'translate-x-5': isOn, 'translate-x-0': !isOn },
        )}
      />
    </span>
  )
}
