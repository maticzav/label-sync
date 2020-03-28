import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import yaml from 'js-yaml'
import ml from 'multilines'
import * as os from 'os'

import { mapEntries } from './data/dict'
import { withDefault } from './utils'

/**
 * Configuration repository is the repository which LabelSync
 * uses to determine the configuration of the service.
 *
 * @param organization
 */
export const getLSConfigRepoName = (owner: string) => `${owner}-labelsync`

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
 * @param input
 */
export function parseConfig(
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
    const parsedConfig = checkLimitations(
      checkAliaii(checkSiblings(fixConfig(config.right))),
    )

    return [null, parsedConfig]
  } catch (err) /* istanbul ignore next */ {
    if (logger) logger(err)
    return [err.message]
  }
}

/**
 * Makes sure that none of LabelSync limitations appears in the cofnig.
 * @param config
 */
function checkLimitations(config: LSCConfiguration): LSCConfiguration {
  /* Check that each label on alias one old label. */
  let multipleAliaiiLabels: { repo: string; labels: string[] }[] = []

  /* Check each repository */
  for (const repoName in config.repos) {
    const repoConfig = config.repos[repoName]

    let multipleAliaiiLabelsInRepo: string[] = []

    /* Check every label for unconfigured siblings. */
    for (const label in repoConfig.labels) {
      const aliaii = withDefault([], repoConfig.labels[label].alias)
      if (aliaii.length > 1) multipleAliaiiLabelsInRepo.push(label)
    }

    if (multipleAliaiiLabelsInRepo.length > 0) {
      multipleAliaiiLabels.push({
        repo: repoName,
        labels: multipleAliaiiLabelsInRepo,
      })
    }
  }

  /**
   * Reports missing siblings.
   */
  if (multipleAliaiiLabels.length !== 0) {
    const report = ml`
    | Configuration references multiple old aliases in some label definitions:
    | ${multipleAliaiiLabels
      .map(
        (s) =>
          `* \`${s.repo}\`:${s.labels.join(
            ', ',
          )} reference more than one alias`,
      )
      .join(os.EOL)}
    |
    | This is the current limitation of LabelSync and will change shortly.
    `
    throw new Error(report)
  }

  return config
}

/**
 * Makes sure that all siblings reference an configured labels.
 * @param config
 */
function checkSiblings(config: LSCConfiguration): LSCConfiguration {
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

  /**
   * Reports missing siblings.
   */
  if (missingSiblings.length !== 0) {
    const report = ml`
    | Configuration references unconfigured siblings:
    | ${missingSiblings
      .map((s) => `* \`${s.sibling}\` in ${s.repo}:${s.label}`)
      .join(os.EOL)}
    `
    throw new Error(report)
  }

  return config
}

/**
 * Makes sure that all aliases in repository appear only once.
 * @param config
 */
function checkAliaii(config: LSCConfiguration): LSCConfiguration {
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

  /**
   * Reports missing siblings.
   */
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
    throw new Error(report)
  }

  return config
}

/**
 * Catches configuration issues that io-ts couldn't catch.
 *
 * @param config
 */
function fixConfig(config: LSCConfiguration): LSCConfiguration {
  const repos = mapEntries(config.repos, fixRepoConfig)

  return {
    ...config,
    repos: repos,
  }
}

/**
 * Fixes issues that io-ts couldn't catch.
 *
 * @param config
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
 *
 * @param color
 */
function fixLabelColor(color: string): string {
  if (color.startsWith('#')) return color.slice(1)
  return color
}
