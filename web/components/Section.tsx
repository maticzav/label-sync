import { useEffect } from 'react'
import React, { useState, PropsWithChildren } from 'react'

export interface Section {
  id: string
  name: string
  className?: string
  onReached?: (section: Section) => void
  onVisible?: (section: Section) => void
}

/**
 * Wraps elements in a div and tracks the visibility of the section.
 */
export default function Section(props: PropsWithChildren<Section>) {
  const [reached, setReached] = useState(false)

  useEffect(() => {
    /* Report visibility on reach. */
    if (reached) {
      if (props.onReached) props.onReached(props)
    }
  }, [reached])

  /* Scroll event handler */
  function handleScroll() {
    const section = document.getElementById(props.id)!

    const topOfSection = section.offsetTop
    const bottomOfSection = section.offsetTop + section.offsetHeight
    const topOfView = window.pageYOffset
    const bottomOfView = window.pageYOffset + window.innerHeight

    /* Section visible to viewer. */
    if (bottomOfView >= topOfSection && topOfView <= bottomOfSection) {
      if (props.onVisible) props.onVisible(props)
      /* Change reached state */
      if (!reached) setReached(true)
    }
  }

  useEffect(() => {
    /* Mount */
    window.addEventListener('scroll', handleScroll)

    /* Unmount */
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div id={props.id} className={props.className}>
      {props.children}
    </div>
  )
}
