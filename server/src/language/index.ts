import ml from 'multilines'
import os from 'os'
import prettier from 'prettier'

import { Maybe } from '../data/maybe'
import * as sync from '../handlers/sync'
import * as configs from '../config'

import { divide, label, list, noun, repository } from './components'

// MARK: - Reporters

export type GenerateReportParams = {
  /**
   * Name of the target repository.
   */
  repo: string
  /**
   * Changes in this configuration.
   */
  changes: Maybe<sync.Changes>
  /**
   * Configuration of the repository.
   */
  config: configs.LSCRepositoryConfiguration
}

/**
 * Generates a human readable report out of PR changes for a list of repositories.
 */
export function generateReport(params: GenerateReportParams[]): string {
  const sorted = params.sort((a, b) =>
    a.changes === null && b.changes !== null ? -1 : 0,
  )

  // Overview
  /**
   * Change reports of the changed repositories.
   */
  let changed: string[] = []
  /**
   * Names of the unchanged repositories.
   */
  let unchanged: string[] = []
  /**
   * Names of the repositories that errored.
   */
  let errored: string[] = []

  for (const report of sorted) {
    if (report.changes === null) {
      errored.push(report.repo)
      continue
    }

    // Unchanged
    if (!sync.changed(report.changes)) {
      unchanged.push(report.repo)
      continue
    }

    // Changed repositories
    changed.push(
      generateChangesReport({
        repo: report.repo,
        changes: report.changes,
        config: report.config,
      }),
    )
  }

  // Compose a structured report.
  let sections: string[] = [
    `## :label: Here's what's going to change when you merge`,
    ...changed,
  ]

  if (unchanged.length > 0) {
    const unchanges = list({
      items: unchanged,
      summary: noun(
        `one unchanged repository`,
        (n) => `${n} unchanged repositories`,
      ),
    })

    sections.push(ml`
    | ### You haven't made any changes in these repositories
    |
    | ${unchanges}
    `)
  }

  if (errored.length > 0) {
    const errors = list({
      items: errored,
      summary: noun(
        `couldn't load one repository`,
        (n) => `couldn't load ${n} repositories`,
      ),
    })

    sections.push(ml`
    | ### We couldn't fetch labels from these repositories:
    |
    | ${errors}
    `)
  }

  // Final touches.
  const report = divide(sections)
  return prettier.format(report, { parser: 'markdown' })
}

// MARK: - Chunks

type ChangesReportParams = {
  repo: string
  changes: sync.Changes
  config: configs.LSCRepositoryConfiguration
}

/**
 * Outlines the changes in a human-readable format.
 */
export function generateChangesReport(params: ChangesReportParams): string {
  let sections: Maybe<string>[] = []

  // Title
  sections.push(`#### ${repository(params.repo)}`)

  // New labels
  sections.push(
    list({
      items: params.changes.additions.map(label),
      summary: noun(
        ':sparkles: one new label',
        (n) => `:sparkles: ${n} new labels`,
      ),
    }),
  )

  // Changed labels
  sections.push(
    list({
      items: params.changes.updates.map(label),
      summary: noun(
        ':lipstick: one label changed',
        (n) => `:lipstick: ${n} changed labels`,
      ),
    }),
  )

  // Renamed labels
  sections.push(
    list({
      items: params.changes.updates.map(label),
      summary: noun(
        ':performing_arts: one label renamed',
        (n) => `:performing_arts: ${n} labels renamed`,
      ),
    }),
  )

  // Removed labels
  if (params.config.removeUnconfiguredLabels) {
    sections.push(
      list({
        items: params.changes.removals.map(label),
        summary: noun(
          ':coffin: one label removed',
          (n) => `:performing_arts: ${n} labels renamed`,
        ),
      }),
    )
  }

  // Unconfigured labels.
  if (!params.config.removeUnconfiguredLabels && params.changes.removals) {
    sections.push(
      list({
        items: params.changes.removals.map(label),
        summary: noun(
          ':mailbox_with_mail: one unconfigured label',
          (n) => `:mailbox_with_mail: ${n} unconfigured labels`,
        ),
      }),
    )

    sections.push(`> Make repository string to remove unconfigured labels.`)
  }

  // Create a report
  const report = sections.join(os.EOL)

  return prettier.format(report, { parser: 'markdown' })
}

type ErrorReportParams = {
  repository: string
  message: string
}

/**
 * Outlines an error encountered in execution.
 */
export function generateErrorReport(params: ErrorReportParams): string {
  return ml`
  | #### ${repository(params.repository)}
  |
  | > ❗️ LabelSync encountered a problem syncing this repository.
  |
  | ${params.message}
  `
}
