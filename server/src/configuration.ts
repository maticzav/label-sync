import { Plan } from '@prisma/client'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import yaml from 'js-yaml'
import ml from 'multilines'
import * as os from 'os'

import { mapEntries, mapKeys } from './data/dict'
import { withDefault } from './utils'

/* Constants */

const NUMBER_OF_FREE_TIERS = 5

/**
 * Configuration repository is the repository which LabelSync
 * uses to determine the configuration of the service.
 */
export const getLSConfigRepoName = (account: string) =>
  `${account.toLowerCase()}-labelsync`

/**
 * Configuration file path determines the path of the file in the repositoy
 * that we use to gather configuration information from.
 *
 * It should always be in YAML format.
 */
export const LS_CONFIG_PATH = 'labelsync.yml'

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
const LSCLabel = t.intersection([
  t.type({
    color: t.string,
  }),
  t.partial({
    description: t.string,
    siblings: t.array(t.string),
    alias: t.array(t.string),
  }),
])
export type LSCLabel = t.TypeOf<typeof LSCLabel>

const LSCLabelName = t.string
export type LSCLabelName = t.TypeOf<typeof LSCLabelName>

/**
 * Repository configuration for how LabelSync should sync it.
 */
const LSCRepositoryConfiguration = t.partial({
  removeUnconfiguredLabels: t.boolean,
})
export interface LSCRepositoryConfiguration
  extends t.TypeOf<typeof LSCRepositoryConfiguration> {}

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
const LSCRepository = t.intersection([
  t.partial({
    config: LSCRepositoryConfiguration,
  }),
  t.type({
    labels: t.record(LSCLabelName, LSCLabel),
  }),
])
export interface LSCRepository extends t.TypeOf<typeof LSCRepository> {}
const LSCRepositoryName = t.string
export type LSCRepositoryName = t.TypeOf<typeof LSCRepositoryName>

/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
const LSCConfiguration = t.type({
  repos: t.record(LSCRepositoryName, LSCRepository),
})
export interface LSCConfiguration extends t.TypeOf<typeof LSCConfiguration> {}

/**
 * Parses a string into a configuration object.
 */
export function parseConfig(
  plan: Plan,
  input: string,
  logger?: (err: any) => any,
): [string] | [null, LSCConfiguration] {
  try {
    const object = yaml.safeLoad(input)
    const config = LSCConfiguration.decode(object)

    if (config._tag === 'Left') {
      return [PathReporter.report(config).join(os.EOL)]
    }

    /* Perform checks on the content */
    const parsedConfig = checkPurchase(
      plan,
      validateCongiuration(fixConfig(config.right)),
    )

    return [null, parsedConfig]
  } catch (err) /* istanbul ignore next */ {
    if (logger) logger(err)
    return [err.message]
  }
}

/* PLAN LIMITATIONS */

/**
 * Makes sure that none of LabelSync limitations appears in the cofnig.
 */
function checkPurchase(plan: Plan, config: LSCConfiguration): LSCConfiguration {
  /* Data */
  const numberOfConfiguredRepos = Object.keys(config.repos).length

  switch (plan) {
    case 'FREE': {
      /* FREE */
      /**
       * Report too many configurations.
       */
      if (numberOfConfiguredRepos >= NUMBER_OF_FREE_TIERS) {
        const report = ml`
        | You are trying to configure more repositories than there are available in your plan.
        | Update your current plan to access all the features LabelSync offers.
        `
        throw new Error(report)
      }

      /**
       * Report wildcard configuration.
       */
      if (Object.keys(config.repos).includes('*')) {
        const report = ml`
        | You are trying to configure a wildcard configuration on a free plan.
        | Update your current plan to access all the features LabelSync offers.
        `
        throw new Error(report)
      }

      return config
    }
    case 'PAID': {
      /* No limits for purchased accounts. */
      return config
    }
  }
}

/* CONTENT CHECK */

/**
 * Returns configuration if everything seems as expected. Throws otherwise
 * with the error exaplanation.
 */
function validateCongiuration(config: LSCConfiguration): LSCConfiguration {
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
      const siblings = withDefault([], repoConfig.labels[label].siblings)

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
    const repoConfig = config.repos[repoName]

    let aliaiiInRepo: { [alias: string]: string[] } = {}

    /* Check every label for unconfigured siblings. */
    for (const label in repoConfig.labels) {
      const aliaii = withDefault([], repoConfig.labels[label].alias)

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
    const repoConfig = config.repos[repoName]

    /**
     * Check every label if it references itself.
     */
    for (const label in repoConfig.labels) {
      const siblings = withDefault([], repoConfig.labels[label].siblings)

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

    throw new Error(report)
  }

  return config
}

/**
 * TRANSFORMATIONS
 */

/**
 * Catches configuration issues that io-ts couldn't catch.
 */
function fixConfig(config: LSCConfiguration): LSCConfiguration {
  const repos = mapEntries(config.repos, fixRepoConfig)
  const lowercaseRepos = mapKeys(repos, (repo) => repo.toLowerCase())

  return {
    ...config,
    repos: lowercaseRepos,
  }
}

/**
 * Fixes issues that io-ts couldn't catch.
 */
function fixRepoConfig(config: LSCRepository): LSCRepository {
  const labels = mapEntries<LSCLabel, LSCLabel>(config.labels, (label) => ({
    ...label,
    color: fixLabelColor(label.color),
  }))

  return {
    ...config,
    labels,
  }
}

/**
 * Removes hash from the color.
 */
export function fixLabelColor(color: string): string {
  if (color.startsWith('#')) return color.slice(1).toLowerCase()
  return color.toLowerCase()
}

/**
 * Returns a list of repositories in configuration without wildcard config.
 */
export function configRepos(config: LSCConfiguration): string[] {
  return Object.keys(config.repos).filter((repo) => repo !== '*')
}

/**
 * Tells whether the repository is the configuration
 * repository for the account.
 */
export function isConfigRepo(account: string, repo: string): boolean {
  return getLSConfigRepoName(account) === repo.toLowerCase()
}
