import fs from 'fs'
import path from 'path'
import { stringify } from 'yaml'

import * as constants from '@labelsync/core/src/constants'

import { Either, right, left, maybe } from './utils'
import { findFolderUp } from './fs'

/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
export type LSConfiguration = {
  repos: Map<LSRepositoryName, LSRepository>
}

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
export type LSRepository = {
  strict: boolean
  labels: Map<LSLabelName, LSLabel>
}
export type LSRepositoryName = string

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
export type LSLabel = LSLabelDefinition | LSLabelColor
export type LSLabelDefinition = {
  description?: string
  color: string
  siblings?: LSSibling[]
  hooks?: LSHook[]
  // oldName?: string -- TODO: renaming
  // perhaps it would be better if renamings were noted in a separate file
  // or through dialogue to skip the unnecessary field deletion step.
  // * PR message: "I have renamed these labels: - old:new"
}
export type LSLabelName = string
export type LSLabelColor = string

/**
 * Hydrates a Label to a Label definition.
 *
 * @param label
 */
export function lsLabelDefinition(label: LSLabel): LSLabelDefinition {
  switch (typeof label) {
    case 'string': {
      return { color: label }
    }
    case 'object': {
      return label
    }
  }
}

/**
 * Sibling represents a label that LabelSync should add whenever
 * a parent label is assigned to issues or pull request.
 * Siblings can only refer to labels also defined in LabelSync repository
 * configuration.
 */
export type LSSibling = string

/**
 * Represents a label hook. LabelSync triggers a label hook
 * every time a hook is added to an issues or a pull request.
 */
export type LSHook =
  /* webhooks */
  | {
      integration: 'webhook'
      endpoint: string
    }
  /* slack */
  | { integration: 'slack'; action: 'notify'; user: string }
  /* pull requests */
  | { integration: 'pr'; action: 'merge' }
  | { integration: 'pr'; action: 'close' }

/**
 * Validates the configuration file and saves its YAML version
 * to labelsync configuration file path.
 *
 * @param config
 */
export async function save(
  config: LSConfiguration,
  dir: string = __dirname,
  logger: (...args: any[]) => any = console.error,
) {
  /* Loads the configuration. */
  const yaml = generateYAMLConfigurationFromTS(config)

  /* Processes the configuration.  */
  await yaml.either({
    left: errors => {
      logger(reportValidationErrors(errors))
    },
    right: async configuration => {
      /* Finds the location. */
      const projectRoot = await findFolderUp(dir, '.git')
      const labelSyncConfigurationFilePath = path.join(
        maybe(dir, projectRoot),
        constants.labelSyncConfigurationFilePath,
      )

      /* Commit configuration. */
      fs.writeFileSync(labelSyncConfigurationFilePath, configuration)
    },
  })
}

/**
 * Converts ValidationErrors to a human readable format.
 *
 * @param errors
 */
function reportValidationErrors(errors: ValidationError[]): string {
  return `many errors ${errors.length}`
}

/**
 * Turns a TypeScript specification into a label-sync readable
 * YAML configuration.
 *
 * @param values
 */
export function generateYAMLConfigurationFromTS(
  config: LSConfiguration,
): Either<ValidationError[], string> {
  const { errors, configuration } = validateConfiguration(config)
  if (errors) {
    return left(errors)
  }
  return right(stringify(configuration))
}

/**
 * Generates a manifest of TS configuration and validates its input.
 * @param values
 */
function validateConfiguration(
  config: LSConfiguration,
): {
  errors: ValidationError[]
  configuration: LSConfiguration
} {
  /* Helper functions */
  const repos = Object.keys(config.repos)
  const repo = (name: string): LSRepository => config.repos.get(name)!

  /* Validator */
  const errors = repos.reduce<ValidationError[]>((acc, repoName) => {
    const repoConfig = repo(repoName)
    const labels = Object.keys(repoConfig.labels)
    const label = (name: string): LSLabelDefinition =>
      lsLabelDefinition(repoConfig.labels.get(name)!)

    /* Check whether repository configuration defines all siblings. */
    const labelsWithMissingSiblings = labels.filterMap<SiblingsValidationError>(
      labelName => {
        const labelConfig = label(labelName)
        const missingSiblings = maybe([], labelConfig.siblings).filter(
          sibling => labels.some(label => label === sibling),
        )

        if (missingSiblings.length > 0) {
          return {
            repository: repoName,
            label: labelName,
            siblings: missingSiblings,
          }
        } else {
          return null
        }
      },
    )

    return acc.concat(labelsWithMissingSiblings)
  }, [])

  /* Process */

  return { errors: errors, configuration: config }
}

export type ValidationError = SiblingsValidationError

export type SiblingsValidationError = {
  repository: string
  label: string
  siblings: LSSibling[]
}
