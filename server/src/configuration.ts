import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import yaml from 'js-yaml'
import * as os from 'os'

import { mapEntries } from './data/dict'

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
    return [null, fixConfig(config.right)]
  } catch (err) /* istanbul ignore next */ {
    if (logger) logger(err)
    return [err.message]
  }
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
  const labels = mapEntries<LSCLabel, LSCLabel>(config.labels, label => ({
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
