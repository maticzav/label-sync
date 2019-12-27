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
  const body = reports.map(parseLabelSyncReport).join(os.EOL)
  return ml`
  | ## PullRequest Overview 
  | > NOTE: This is only a preview of what will happen. Nothing has been changed yet.
  | 
  | ${body}
  `

  /* Helper functions. */
  function parseLabelSyncReport(report: LabelSyncReport): string {
    switch (report.status) {
      case 'Success': {
        return ml`
        | #### \`${report.repo}\`
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
      case 'Failure': {
        return ml`
        | #### \`${report.repo}\`
        |
        | ${report.message}
        `
      }
    }
  }
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
