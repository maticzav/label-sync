import ml from 'multilines'
import os from 'os'
import { stringifyUrl } from 'query-string'

import { Maybe } from '../data/maybe'
import { GithubLabel } from '../github'

// MARK: - Badge

type BadgeProps = { name: string; color: string }

/**
 * Creates a colorful badge for the label.
 */
export function badge(props: BadgeProps): string {
  const url = stringifyUrl({
    url: 'https://img.shields.io/static/v1',
    query: {
      label: '',
      message: props.name,
      color: props.color,
    },
  })

  return `![${props.name}](${url} "${props.name}")`
}

/**
 * Let's you create singular and plural versions of a string.
 */
export function noun(
  singular: string,
  plural: (val: number) => string,
): (val: number) => string {
  return (n: number) => {
    if (n == 1) return singular
    return plural(n)
  }
}

/**
 * Parses the repo name with backticks.
 *
 * @param name
 */
export function repository(name: string): string {
  return ['`', name, '`'].join('')
}

type ListProps = {
  items: string[]
  summary: (n: number) => string
}

/**
 * Creates a list of items or returns null if there's no item.
 */
export function list(props: ListProps): Maybe<string> {
  if (props.items.length === 0) return null

  const items = props.items.map((item) => ` * ${item}`).join(os.EOL)

  return ml`
  | <details>
  |   <summary>${props.summary}</summary>
  |
  |   ${items}
  | </details>
  `
}

/**
 * Divides different parts using markdown divider.
 */
export function divide(items: string[]): string {
  const separator = ['\n', '---', '\n'].join(os.EOL)
  return items.join(separator)
}

/**
 * Explain the changes of a single label.
 */
export function label(label: GithubLabel): string {
  /* Find changes */
  const nameChanged = label.old_name && label.old_name !== label.name
  const descChanged =
    label.old_description && label.old_description !== label.description
  const colorChanged = label.old_color && label.old_color !== label.color

  const changes: string[] = [
    (nameChanged && 'name') || null,
    (descChanged && 'description') || null,
    (colorChanged && 'color') || null,
  ].filter(isString)

  /* Label */
  let text: string
  if (changes.length > 0) text = `${label.name} (${multiple(changes)} changed)`
  else text = label.name

  return ` * ${badge({ name: text, color: label.color })}`

  /* Helper functions */

  function multiple(vals: string[]): string {
    const [head, ...tail] = vals
    if (tail.length === 0) return head
    if (tail.length === 1) return `${head} and ${tail[0]}`
    else return `${head}, ${multiple(tail)}`
  }

  function isString(x: string | null): x is string {
    return x !== null
  }
}
