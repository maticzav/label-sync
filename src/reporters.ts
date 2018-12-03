import chalk from 'chalk'
import { RepositorySyncReport } from './handlers'
import { GithubLabel } from './labels'

/**
 *
 * Generates human readable sync report.
 *
 * @param reports
 */
export function generateSyncReport(reports: RepositorySyncReport[]) {
  const message = `
Synced labels accross ${reports.length} repositories;
${reports.map(generateRepositorySyncReport).join('\n\n')}
      `

  return message

  /**
   * Helper functions
   */
  function generateRepositorySyncReport(report: RepositorySyncReport): string {
    const message = `
Synced ${report.name}:
  
${generateLabelsSyncReport({ action: 'add', labels: report.additions })}
  
${generateLabelsSyncReport({ action: 'update', labels: report.updates })}
  
${generateLabelsSyncReport({
      action: 'remove',
      labels: report.removals,
      warn: report.configuration.strict!,
    })}
    `

    return message
  }

  function generateLabelsSyncReport(
    options:
      | { action: 'add'; labels: GithubLabel[] }
      | { action: 'update'; labels: GithubLabel[] }
      | { action: 'remove'; labels: GithubLabel[]; warn: boolean },
  ) {
    switch (options.action) {
      case 'add': {
        if (options.labels.length === 0) {
          return `No new labels.`
        }

        return `
Added ${options.labels.length} labels:
${options.labels.map(generateLabelSyncReport)}
        `
      }

      case 'update': {
        if (options.labels.length > 0) {
          return `No labels updated.`
        }

        return `
Updated ${options.labels.length} labels:
${options.labels.map(generateLabelSyncReport)}
        `
      }

      case 'remove': {
        if (options.labels.length > 0) {
          return `No labels removed.`
        }

        if (options.warn) {
          return `
${options.labels.length} labels should be removed;
${options.labels.map(generateLabelSyncReport)}

To remove them, set "strict" property to true in repository configuration.
    `
        } else {
          return `
Removed ${options.labels.length} labels:
${options.labels.map(generateLabelSyncReport)}
                  `
        }
      }
    }
  }

  function generateLabelSyncReport(label: GithubLabel): string {
    return chalk.hex(label.color)(` - ${label.name}\n`)
  }
}
