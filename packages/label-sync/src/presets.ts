import { Label } from './generator'

export const colors = {
  neutral: '#EEEEEE',
  refine: '#fcaeec',
  shiny: '#3BDB8D',
  semiShiny: '#9cedc6',
  danger: '#FF5D5D',
  warning: '#FFCF2D',
  social: '#7057ff',
}

/**
 * Based off conventional commit notion of type. The kind of issue.
 * These labels may get their own colour to help visually differentiate
 * between them faster. The commit that closes this issue should generally
 * be of the same type as this label.
 */
export function type(name: string, color: string, description?: string): Label {
  return new Label({
    name: `type/${name}`,
    color: color,
    description: description,
  })
}

/**
 * Labels that help us track issue short-circuites or other minimal
 * categorical details.
 */
export function note(name: string, description?: string): Label {
  return new Label({
    name: `note/${name}`,
    color: colors.neutral,
    description: description,
  })
}

/**
 * Labels that help us track how impactful issues will be. Combined
 * with complexity label, helps inform prioritization.
 */
export function impact(name: string, description?: string): Label {
  return new Label({
    name: `impact/${name}`,
    color: colors.neutral,
    description: description,
  })
}

/**
 * Effort that help us track how impactful issues will be. Combined
 * with complexity label, helps inform prioritization.
 */
export function effort(name: string, description?: string): Label {
  return new Label({
    name: `effort/${name}`,
    color: colors.neutral,
    description: description,
  })
}

/**
 * Labels that help us mark issues as being on hold for some reason.
 */
export function needs(name: string, description?: string): Label {
  return new Label({
    name: `needs/${name}`,
    color: colors.warning,
    description: description,
  })
}

/**
 * Based off conventional commit notion of scope. What area of
 * the project does the issue touch. The commit that closes this issue
 * should generally be of the same scope as this label.
 */
export function scope(name: string, description?: string): Label {
  return new Label({
    name: `scope/${name}`,
    color: '#94ebfc',
    description: description,
  })
}

/**
 * Labels that help us coordinate with the community.
 */
export function community(name: string, description?: string): Label {
  return new Label({
    name: `community/${name}`,
    color: colors.social,
    description: description,
  })
}
