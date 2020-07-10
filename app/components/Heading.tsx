import React from 'react'

/**
 * Represents a heading component for smaller titles.
 */
export function Heading(props: React.PropsWithChildren<{}>) {
  return (
    <div className="p-3">
      <h2 className="text-3xl">{props.children}</h2>
    </div>
  )
}
