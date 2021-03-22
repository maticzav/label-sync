import ml from 'multilines'
import os from 'os'
import prettier from 'prettier'
import { stringifyUrl } from 'query-string'

import { GithubLabel } from '../github'
import { LabelSyncReport } from '../handlers/labels'
import { not } from '../utils'
import { isNull } from 'util'

/**
 * Generates a human readable report out of PR changes.
 */
export function generateHumanReadablePRReport(
  reports: LabelSyncReport[],
): string {
  const changedReports = reports
    .filter(reportHasChanges)
    .sort(orderReports)
    .map(parseLabelSyncReport)

  const unchangedReports = reports.filter(not(reportHasChanges))
  const report = ml`
  | ## :label: Here's what's going to change when you merge
  | 
  | ${joinReports(changedReports)}
  |
  | ---
  |
  | ### You haven't made any changes in these repositories
  |
  | ${ulOfUnchangedReports(unchangedReports)}
  `

  return prettier.format(report, { parser: 'markdown' })

  /* Helper functions */

  /**
   * Tells whether report has changed.
   */
  function reportHasChanges(report: LabelSyncReport): boolean {
    switch (report.status) {
      case 'Success': {
        return (
          report.additions.length +
            report.aliases.length +
            report.removals.length +
            report.updates.length >
          0
        )
      }
      case 'Failure': {
        /* Failure should always be treated as report with changes. */
        return true
      }
    }
  }
}

/**
 * Generates a concise review of changes.
 */
export function generateHumanReadableCommitReport(
  reports: LabelSyncReport[],
): string {
  const changedReports = reports
    .filter(reportHasChanges)
    .sort(orderReports)
    .map(parseLabelSyncReport)

  const report = ml`
  | ## :label: Here's what has changed.
  | 
  | ${joinReports(changedReports)}
  `

  return prettier.format(report, { parser: 'markdown' })

  /* Helper function */

  /**
   * Tells whether report has changed.
   */
  function reportHasChanges(report: LabelSyncReport): boolean {
    switch (report.status) {
      case 'Success': {
        /* Create read or update actions */
        const crus =
          report.additions.length +
            report.aliases.length +
            report.updates.length >
          0
        /* Actual removals. */
        const ds =
          report.config.config.removeUnconfiguredLabels &&
          report.removals.length > 0

        return crus || ds
      }
      case 'Failure': {
        /* Failure should always be treated as report with changes. */
        return true
      }
    }
  }
}

/**
 * Label report ordering function.
 */
function orderReports(a: LabelSyncReport, b: LabelSyncReport): number {
  /* Show Failures first. */
  if (a.status === 'Failure') return -1
  return 0
}

function parseLabelSyncReport(report: LabelSyncReport): string {
  switch (report.status) {
    case 'Success': {
      const { removeUnconfiguredLabels } = report.config.config

      /* Sections */

      const sections: (string | null)[] = [
        /* Repository name */
        `#### ${parseRepoName(report.repo)}`,
        /* New labels */
        ulOfLabels(
          report.additions,
          singular(
            ':sparkles: 1 new label.',
            (n) => `:sparkles: ${n} new labels.`,
          ),
        ),
        /* Updated labels */
        ulOfLabels(
          report.updates,
          singular(
            ':lipstick: 1 label changed.',
            (n) => `:lipstick: ${n} changed labels.`,
          ),
        ),
        /* Aliased labels */
        ulOfLabels(
          report.aliases,
          singular(
            ':performing_arts: 1 new label alias.',
            (n) => `:performing_arts: ${n} aliases.`,
          ),
        ),
        /* Unconfigured labels and removals */
        (() => {
          if (removeUnconfiguredLabels) {
            return ulOfLabels(
              report.removals,
              singular(
                ':coffin: 1 removed label.',
                (n) => `:coffin: ${n} removed labels.`,
              ),
            )
          }
          return ulOfLabels(
            report.removals,
            singular(
              ':mailbox_with_mail: 1 label unconfigured.',
              (n) => `:mailbox_with_mail: ${n} unconfigured labels.`,
            ),
          )
        })(),
        /* Message about strictness */
        (() => {
          if (!removeUnconfiguredLabels && report.removals.length === 0) {
            return '> You have no unconfigured labels - you could make this repository `strict`.'
          }
          return null
        })(),
      ]

      return sections.filter(not(isNull)).join(os.EOL)
    }
    case 'Failure': {
      return ml`
      | #### ${parseRepoName(report.repo)}
      |
      | > ❗️ LabelSync encountered a problem syncing this repository.
      |
      | ${report.message}
      `
    }
  }
}

/**
 * Let's you create singular and plural versions of a string.
 */
function singular(
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
function parseRepoName(name: string): string {
  return ['`', name, '`'].join('')
}

/**
 * Creates a human readable list of labels.
 */
function ulOfLabels(
  labels: GithubLabel[],
  summary: (n: number) => string,
): string | null {
  if (labels.length == 0) return null
  return ml`
  | <details>
  |   <summary>${summary(labels.length)}</summary>
  |
  | ${labels.map(label).join(os.EOL)}
  |
  | </details>
  |
  `
}

/**
 * Returns a string representation of label.
 */
function label(label: GithubLabel): string {
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

/**
 * Creates a list of unchanged reports.
 */
function ulOfUnchangedReports(reports: LabelSyncReport[]): string {
  if (reports.length === 0) return `No unchanged repositories.`

  const repos = reports
    .map((report) => ` * ${parseRepoName(report.repo)}`)
    .join(os.EOL)

  return ml`
  | <details>
  |   <summary>${reports.length} repositories.</summary>
  |
  | ${repos}
  |
  | </details>
  `
}

/**
 * Creates a colorful badge for the label.
 */
function badge(props: { name: string; color: string }): string {
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
 * Joins reports with a separator.
 * @param reports
 */
function joinReports(reports: string[]): string {
  const separator = ['\n', '---', '\n'].join(os.EOL)
  return reports.join(separator)
}
