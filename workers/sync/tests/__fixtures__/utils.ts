import { EOL } from 'os'

/**
 * This is a collection of utility functions for tests.
 */

/**
 * Converts winston's log file to JSON array.
 */
export function logToJSON(file: string): object[] {
  const lines = file
    .split(EOL)
    .filter((line) => Boolean(line))
    .join(',')
  const jsonfile = `[${lines}]`

  return JSON.parse(jsonfile)
}

/**
 * Removes date fields from the logs. Useful for snapshot generation.
 */
export function removeLogsDateFields(log: any): any {
  delete log['timestamp']
  if (typeof log['meta'] === 'string') {
    log.meta = JSON.parse(log.meta)
  }
  if (log['meta']) {
    log.meta['periodEndsAt'] = 'periodEndsAt'
  }
  return log
}
