import React from 'react'

export type TransitionProps = {
  /* Indicates visibility of the child. */
  in: boolean
  /* Classes that are added to the child during different states. */
  classNames: {
    active: string
    transitioning: string
    inactive: string
  }
  /* Animation duration. */
  timeout: number
  /* Event hooks */
  onEntering?: () => void
  onEntered?: () => void
  onExiting?: () => void
  onExited?: () => void
  children: React.ReactElement
}

type TransitionState = {
  status: 'active' | 'inactive' | 'entering' | 'exiting'
}

/**
 * Component wrapper to handle class manipulation in
 */
export class Transition extends React.Component<
  TransitionProps,
  TransitionState
> {
  constructor(props: TransitionProps) {
    super(props)

    this.state = {
      status: props.in ? 'active' : 'inactive',
    }
  }

  /**
   * Compares previous state with props to derive new state.
   */
  static getDerivedStateFromProps(
    { in: nextIn }: TransitionProps,
    prevState: TransitionState,
  ): TransitionState | null {
    if (prevState.status === 'active' && nextIn === false) {
      return { status: 'exiting' }
    }
    if (prevState.status === 'inactive' && nextIn === true) {
      return { status: 'entering' }
    }
    return null
  }

  componentDidUpdate(prevProps: TransitionProps, prevState: TransitionState) {
    const { status } = this.state
    const { status: prevStatus } = prevState

    if (status !== prevStatus && ['entering', 'exiting'].includes(status)) {
      this.animate()
    }
  }

  /* Performs the animation. */
  animate() {
    const nextStatus = this.state.status === 'entering' ? 'active' : 'inactive'

    if (this.state.status === 'entering') {
      if (this.props.onEntering) this.props.onEntering()
    }
    if (this.state.status === 'exiting') {
      if (this.props.onExiting) this.props.onExiting()
    }

    setTimeout(() => {
      this.setState({
        status: nextStatus,
      })

      /* Trigger event hooks */
      if (nextStatus === 'active') {
        if (this.props.onEntered) this.props.onEntered()
      } else {
        if (this.props.onExited) this.props.onExited()
      }
    }, this.props.timeout)
  }

  render() {
    const { classNames, children } = this.props
    let { className, ...otherProps } = children.props

    /* Append correct classes */
    switch (this.state.status) {
      case 'active': {
        className = concatClassNames(className, classNames.active)
        break
      }
      case 'exiting': {
        className = concatClassNames(
          className,
          classNames.active,
          classNames.transitioning,
        )
        break
      }
      case 'entering': {
        className = concatClassNames(
          className,
          classNames.inactive,
          classNames.transitioning,
        )
        break
      }
      case 'inactive': {
        className = concatClassNames(className, classNames.inactive)
        break
      }
    }
    const transitionClassName = className

    return React.cloneElement(children, {
      className: transitionClassName,
      ...otherProps,
    })
  }
}

/**
 * Concatenates two strings of class names.
 * For example:
 *  concatClassNames("red blue", "green yellow") === "red blue green yellow"
 */
function concatClassNames(base: string, ...adds: string[]): string {
  let classNames = base.split(' ')
  for (const add of adds) {
    classNames.push(...add.split(' '))
  }
  return classNames.join(' ')
}
