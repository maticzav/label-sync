import React from 'react'

/* Represents a scrollable div. */
export default function Scroll(props: React.PropsWithChildren<{}>) {
  return <div className="h-full w-full overflow-y-auto">{props.children}</div>
}
