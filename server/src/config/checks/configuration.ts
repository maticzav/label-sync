import ml from 'multilines'
import * as os from 'os'

import * as t from '../types'
import { Check } from '../parser'

import { mapEntries, mapKeys } from '../../data/map'
import { withDefault } from '../../utils'

export const checkConfiguration: Check = (config) => {
  /**
   * We accumulate possible errors in all the checks and throw the collection.
   */
  let errors: string[] = []

  /* MISSING SIBLINGS */

  /**
   * All siblings should be defined in the configuration.
   */

  let missingSiblings: { repo: string; sibling: string; label: string }[] = []
  for (const repoName in config.repos) {
    const repoConfig = config.repos.get(repoName)!
    const configuredLabels = Object.keys(repoConfig.labels)

    /* Check every label for unconfigured siblings. */
    for (const label in repoConfig.labels) {
      const siblings = withDefault([], repoConfig.labels.get(label)?.siblings)

      for (const sibling of siblings) {
        /* Report unconfigured missing sibling. */
        if (!configuredLabels.includes(sibling)) {
          missingSiblings.push({ repo: repoName, sibling, label })
        }
      }
    }
  }

  if (missingSiblings.length !== 0) {
    const report = ml`
    | Configuration references unconfigured siblings:
    | ${missingSiblings
      .map((s) => `* \`${s.sibling}\` in ${s.repo}:${s.label}`)
      .join(os.EOL)}
    `
    errors.push(report)
  }

  /* ALIAS SPLITING */

  /**
   * You shouldn't make two new labels aliasing one label.
   */

  let duplicateAliaii: { repo: string; alias: string; labels: string[] }[] = []

  /* Check each repository */
  for (const repoName in config.repos) {
    const repoConfig = config.repos.get(repoName)!

    let aliaiiInRepo: { [alias: string]: string[] } = {}

    /* Check every label for unconfigured siblings. */
    for (const label in repoConfig.labels) {
      const aliaii = withDefault([], repoConfig.labels.get(label)?.alias)

      /* Create a map of aliases. */
      for (const alias of aliaii) {
        if (!aliaiiInRepo.hasOwnProperty(alias)) aliaiiInRepo[alias] = []
        aliaiiInRepo[alias].push(label)
      }
    }

    /* Find multiples */
    for (const alias in aliaiiInRepo) {
      if (aliaiiInRepo[alias].length > 1) {
        duplicateAliaii.push({
          repo: repoName,
          alias,
          labels: aliaiiInRepo[alias],
        })
      }
    }
  }

  if (duplicateAliaii.length !== 0) {
    const report = ml`
    | Configuration references same old label twice in alias:
    | ${duplicateAliaii
      .map(
        (s) => `* \`${s.alias}\` appears in ${s.repo}:${s.labels.join(', ')}`,
      )
      .join(os.EOL)}
    |
    | Each legacy label may only be referenced once in alias.
    `
    errors.push(report)
  }

  /* SELF REFERENCES */

  /**
   * Siblings shouldn't self-reference themselves.
   */

  let selfreferencingSiblings: { repo: string; label: string }[] = []
  for (const repoName in config.repos) {
    const repoConfig = config.repos.get(repoName)!

    /**
     * Check every label if it references itself.
     */
    for (const label in repoConfig.labels) {
      const siblings = withDefault([], repoConfig.labels.get(label)?.siblings)

      if (siblings.includes(label)) {
        selfreferencingSiblings.push({ repo: repoName, label })
      }
    }
  }

  if (selfreferencingSiblings.length !== 0) {
    const report = ml`
    | Some of the labels in the configuration reference itself as a sibling:
    | ${selfreferencingSiblings
      .map((s) => `* \`${s.label}\` in ${s.repo}`)
      .join(os.EOL)}
    `
    errors.push(report)
  }

  /* DESCRIPTION LENGTHS */

  /**
   * Siblings shouldn't self-reference themselves.
   */

  let labelsWithTooLongDescriptions: { repo: string; label: string }[] = []
  for (const repoName in config.repos) {
    const repoConfig = config.repos.get(repoName)!

    /**
     * Check every label if it references itself.
     */
    for (const label in repoConfig.labels) {
      const { description } = repoConfig.labels.get(label)!

      if (description && description.length > 1000) {
        labelsWithTooLongDescriptions.push({ repo: repoName, label })
      }
    }
  }

  if (labelsWithTooLongDescriptions.length !== 0) {
    const report = ml`
     | Some of the labels in the configuration have too long descriptions:
     | ${selfreferencingSiblings
       .map((s) => `* \`${s.label}\` in ${s.repo}`)
       .join(os.EOL)}
      
     | The maximum is 1000 characters.
     `
    errors.push(report)
  }

  /**
   * Collect the errors and throw if necessary.
   */

  if (errors.length > 0) {
    const report = errors.join(os.EOL)

    return { success: false, error: report }
  }

  return { success: true, config }
}

// MARK: - Utility functions

/**
 * TRANSFORMATIONS
 */

/**
 * Catches configuration issues that io-ts couldn't catch.
 */
function fixConfig(config: t.LSCConfiguration): t.LSCConfiguration {
  const repos = mapEntries(config.repos, fixRepoConfig)
  const lowercaseRepos = mapKeys(repos, (repo) => repo.toLowerCase())

  return { ...config, repos: lowercaseRepos }
}

/**
 * Fixes issues that io-ts couldn't catch.
 */
function fixRepoConfig(config: t.LSCRepository): t.LSCRepository {
  const labels = mapEntries(config.labels, (label) => ({
    ...label,
    color: fixLabelColor(label.color),
  }))

  return { ...config, labels }
}

/**
 * Removes hash from the color.
 */
export function fixLabelColor(color: string): string {
  if (color.startsWith('#')) return color.slice(1).toLowerCase()
  return color.toLowerCase()
}
