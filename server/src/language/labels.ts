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
        | #### ${report.repo}
        |
        | __New labels:__
        | ${ulOfLabels(report.additions)}
        |
        | __Changed labels:__
        | ${ulOfLabels(report.updates)}
        |
        | __Remvoed labels:__
        | ${ulOfLabels(report.removals)}
        `
      }
      case 'Failure': {
        return ml`
        | #### ${report.repo}
        |
        | ${report.message}
        `
      }
    }
  }
}

function ulOfLabels(labels: GithubLabel[]): string {
  return labels.map(label => ` * ${label.name}`).join(os.EOL)
}
