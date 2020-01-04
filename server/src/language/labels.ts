import ml from 'multilines'
import os from 'os'

import { LabelSyncReport } from '../handlers/labels'
import { GithubLabel } from '../github'

/**
 * Concatenates multiple reports into a human readable string.
 *
 * @param reports
 */
export function generateHumanReadableReport(
  reports: LabelSyncReport[],
): string {
  const body = joinReports(reports.map(parseLabelSyncReport))

  return ml`
  | ## LabelSync Overview 
  | > NOTE: This is only a preview of what will happen. Nothing has been changed yet.
  | 
  | ${body}
  `
}

function parseLabelSyncReport(report: LabelSyncReport): string {
  switch (report.status) {
    case 'Success': {
      switch (report.config.strict) {
        case true: {
          return ml`
          | ### ${parseRepoName(report.repo)}
          |
          | __New labels:__
          | ${ulOfLabels(report.additions, `No new labels created.`)}
          |
          | __Changed labels:__
          | ${ulOfLabels(report.updates, `No changed labels.`)}
          |
          | __Removed labels:__
          | ${ulOfLabels(report.removals, `You haven't removed any label.`)}
        `
        }
        case false: {
          return ml`
          | ### ${parseRepoName(report.repo)}
          |
          | __New labels:__
          | ${ulOfLabels(report.additions, `No new labels created.`)}
          |
          | __Changed labels:__
          | ${ulOfLabels(report.updates, `No changed labels.`)}
          |
          | __Unconfigured labels.__
          | ${ulOfLabels(
            report.removals,
            'You have no unconfigured labels - you could make this repository `strict`.',
          )}
          `
        }
      }
    }
    case 'Failure': {
      return ml`
      | #### \`${report.repo}\`
      |
      | ${report.message}
      `
    }
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
 *
 * @param labels
 */
function ulOfLabels(labels: GithubLabel[], empty: string): string {
  if (labels.length === 0) return empty
  return labels.map(label => ` * ${label.name}`).join(os.EOL)
}

/**
 * Joins reports with a separator.
 * @param reports
 */
function joinReports(reports: string[]): string {
  const separator = ['', '---', ''].join(os.EOL)
  return reports.join(separator)
}
