import yaml from 'js-yaml'
import ml from 'multilines'
import * as os from 'os'

import { LSCConfiguration, LSCLabel, LSCRepository } from './types'
import { mapEntries, mapKeys } from './utils'

/* Constants */

const NUMBER_OF_FREE_TIERS = 5

/**
 * Configuration repository is the repository which LabelSync
 * uses to determine the configuration of the service.
 */
export const getLSConfigRepoName = (account: string) => `${account.toLowerCase()}-labelsync`

/**
 * Configuration file path determines the path of the file in the repositoy
 * that we use to gather configuration information from.
 *
 * It should always be in YAML format.
 */
export const LS_CONFIG_PATH = 'labelsync.yml'

/**
 * Parses a string into a configuration object.
 */
export function parseConfig({
  input,
  isPro,
}: {
  input: string
  isPro: boolean
}): { ok: true; config: LSCConfiguration } | { ok: false; error: string } {
  const rawConfig = yaml.load(input, {})
  const parsedConfig = LSCConfiguration.safeParse(rawConfig)

  if (!parsedConfig.success) {
    return { ok: false, error: parsedConfig.error.message }
  }

  const normalizedConfig = normalizeConfig(parsedConfig.data)
  const validatedConfig = validateConfiguration(normalizedConfig)

  if (!validatedConfig.ok) {
    return { ok: false, error: validatedConfig.error }
  }

  const acceptable = checkPurchase({
    config: validatedConfig.config,
    isPro,
  })

  if (!acceptable.ok) {
    return { ok: false, error: acceptable.error }
  }

  return { ok: true, config: validatedConfig.config }
}

/**
 * Makes sure that the config respects plan limitations..
 */
function checkPurchase({
  config,
  isPro,
}: {
  config: LSCConfiguration
  isPro: boolean
}): { ok: true } | { ok: false; error: string } {
  const numberOfConfiguredRepos = Object.keys(config.repos).length

  if (isPro) {
    return { ok: true }
  }

  /**
   * Report too many configurations.
   */
  if (numberOfConfiguredRepos >= NUMBER_OF_FREE_TIERS) {
    const report = ml`
        | You are trying to configure more repositories than there are available in your plan.
        | Update your current plan to access all the features LabelSync offers.
        `
    return { ok: false, error: report }
  }

  /**
   * Report wildcard configuration.
   */
  if (Object.keys(config.repos).includes('*')) {
    const report = ml`
        | You are trying to configure a wildcard configuration on a free plan.
        | Update your current plan to access all the features LabelSync offers.
        `
    return { ok: false, error: report }
  }

  return { ok: true }
}

/* CONTENT CHECK */

/**
 * Returns configuration if everything seems as expected. Throws otherwise
 * with the error exaplanation.
 */
function validateConfiguration(
  config: LSCConfiguration,
): { ok: true; config: LSCConfiguration } | { ok: false; error: string } {
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
    const repoConfig = config.repos[repoName]
    const configuredLabels = Object.keys(repoConfig.labels)

    /* Check every label for unconfigured siblings. */
    for (const label in repoConfig.labels) {
      const siblings = repoConfig.labels[label].siblings ?? []

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
    | ${missingSiblings.map((s) => `* \`${s.sibling}\` in ${s.repo}:${s.label}`).join(os.EOL)}
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
    const repoConfig = config.repos[repoName]

    let aliaiiInRepo: { [alias: string]: string[] } = {}

    /* Check every label for unconfigured siblings. */
    for (const label in repoConfig.labels) {
      const aliaii = repoConfig.labels[label].alias ?? []

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
    | ${duplicateAliaii.map((s) => `* \`${s.alias}\` appears in ${s.repo}:${s.labels.join(', ')}`).join(os.EOL)}
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
    const repoConfig = config.repos[repoName]

    /**
     * Check every label if it references itself.
     */
    for (const label in repoConfig.labels) {
      const siblings = repoConfig.labels[label].siblings ?? []

      if (siblings.includes(label)) {
        selfreferencingSiblings.push({ repo: repoName, label })
      }
    }
  }

  if (selfreferencingSiblings.length !== 0) {
    const report = ml`
    | Some of the labels in the configuration reference itself as a sibling:
    | ${selfreferencingSiblings.map((s) => `* \`${s.label}\` in ${s.repo}`).join(os.EOL)}
    `
    errors.push(report)
  }

  /* DESCRIPTION LENGTHS */

  /**
   * Siblings shouldn't self-reference themselves.
   */

  let labelsWithTooLongDescriptions: { repo: string; label: string }[] = []
  for (const repoName in config.repos) {
    const repoConfig = config.repos[repoName]

    /**
     * Check every label if it references itself.
     */
    for (const label in repoConfig.labels) {
      const { description } = repoConfig.labels[label]

      if (description && description.length > 1000) {
        labelsWithTooLongDescriptions.push({ repo: repoName, label })
      }
    }
  }

  if (labelsWithTooLongDescriptions.length !== 0) {
    const report = ml`
     | Some of the labels in the configuration have too long descriptions:
     | ${selfreferencingSiblings.map((s) => `* \`${s.label}\` in ${s.repo}`).join(os.EOL)}
      
     | The maximum is 1000 characters.
     `
    errors.push(report)
  }

  /**
   * Collect the errors and throw if necessary.
   */

  if (errors.length > 0) {
    return { ok: false, error: errors.join(os.EOL) }
  }

  return { ok: true, config }
}

/**
 * TRANSFORMATIONS
 */

/**
 * Normalizes configuration that's easier to work with.
 */
function normalizeConfig(config: LSCConfiguration): LSCConfiguration {
  const repos = mapEntries(config.repos, fixRepoConfig)
  const lowercaseRepos = mapKeys(repos, (repo) => repo.toLowerCase())

  return {
    ...config,
    repos: lowercaseRepos,
  }
}

function fixRepoConfig(config: LSCRepository): LSCRepository {
  const labels = mapEntries<LSCLabel, LSCLabel>(config.labels, (label) => ({
    ...label,
    color: normalizeColor(label.color),
  }))

  return {
    ...config,
    labels,
  }
}

export function normalizeColor(color: string): string {
  if (color.startsWith('#')) return color.slice(1).toLowerCase()
  return color.toLowerCase()
}

/**
 * Returns a list of repositories in configuration without wildcard config.
 */
export function getPhysicalRepositories(config: LSCConfiguration): string[] {
  return Object.keys(config.repos).filter((repo) => repo !== '*')
}

/**
 * Tells whether the repository is the configuration
 * repository for the account.
 */
export function isConfigRepo(account: string, repo: string): boolean {
  return getLSConfigRepoName(account) === repo.toLowerCase()
}
