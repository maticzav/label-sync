import * as yaml from 'js-yaml'

import * as t from './types'

/**
 * Check represents a function that checks if everything
 * is as it should be and may modify the config while
 * still conforming to the type.
 */
type T = t.LSCConfiguration

export type Check = (val: T) => CheckResult
export type CheckResult =
  | { success: true; config: T }
  | { success: false; error: string }

export type ParseResult =
  | { success: true; config: T }
  | { success: false; error: string }

/**
 * Parses a string into a configuration object and performs
 * a collection of checks.
 */
export function parse(input: string, checks: Check[] = []): ParseResult {
  try {
    const object = yaml.load(input)
    const parsed = t.LSCConfiguration.safeParse(object, {})

    /**
     * We construct an error report in case of invalid configuration.
     */
    if (parsed.success === false) {
      let message = ''

      for (const issue of parsed.error.errors) {
        const path = `\`${issue.path.join('/')}\``
        message += ` * ${path}: ${issue.message}`
      }

      return { success: false, error: message }
    }

    /* Perform checks on the content */
    let config = parsed.data

    for (const check of checks) {
      const result = check(config)

      if (result.success === false) {
        return { success: false, error: result.error }
      }

      config = result.config
    }

    return { success: true, config }
  } catch (err) /* istanbul ignore next */ {
    return { success: false, error: err.message }
  }
}
