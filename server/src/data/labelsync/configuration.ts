import debug from 'debug'
// import * as either from 'fp-ts/lib/Either'
// import { pipe } from 'fp-ts/lib/pipeable'
import { Either, either, right, left, fold, chain } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Octokit } from 'probot'
import yaml from 'yaml'

import { labelSyncConfigurationFilePath } from '../constants'
import { filterMap, none, some } from 'fp-ts/lib/Option'

/* File logger. */

const log = debug('data:configuration')

/**
 * Every type that is related to configuration.
 *
 * "Configuration" = "LS"-prefix
 */

/* Types */

/**
 * Sibling represents a label that LabelSync should add whenever
 * a parent label is assigned to issues or pull request.
 * Siblings can only refer to labels also defined in LabelSync repository
 * configuration.
 */
const LSSibling = t.string
export type LSSibling = t.TypeOf<typeof LSSibling>

/**
 * Represents a label hook. LabelSync triggers a label hook
 * every time a hook is added to an issues or a pull request.
 */
const LSHook = t.union([
  t.type({
    integration: t.literal('webhook'),
    endpoint: t.string,
  }),
  t.type({
    integration: t.literal('slack'),
    action: t.literal('notify'),
    users: t.array(t.string),
    channels: t.array(t.string),
  }),
  t.type({
    integration: t.literal('pr'),
    action: t.union([t.literal('merge'), t.literal('close')]),
  }),
])
export type LSHook = t.TypeOf<typeof LSHook>

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
const LSLabel = t.type({
  description: t.string,
  color: t.string,
  siblings: t.array(LSSibling),
  hooks: t.array(LSHook),
})
export type LSLabel = t.TypeOf<typeof LSLabel>

const LSLabelName = t.string
export type LSLabelName = t.TypeOf<typeof LSLabelName>

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
const LSRepository = t.type({
  strict: t.boolean,
  labels: t.record(LSLabelName, LSLabel),
})
type LSRepository = t.TypeOf<typeof LSRepository>
export interface ILSRepository extends LSRepository {}

const LSRepositoryName = t.string
export type LSRepositoryName = t.TypeOf<typeof LSRepositoryName>

/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
const LSConfiguration = t.type({
  repos: t.record(LSRepositoryName, LSRepository),
})
type LSConfiguration = t.TypeOf<typeof LSConfiguration>
export interface ILSConfiguration extends LSConfiguration {}

/* Validation */

/**
 * Processes a decoded YAML configuration. It doesn't perform
 * any content checks.
 *
 * @param yaml
 */
export function validateYAMLConfiguration(
  yaml: object,
): Either<t.Errors, LSConfiguration> {
  return LSConfiguration.decode(yaml)
}

export interface ConfigurationValidationError {
  path: string[]
  value: string[]
  message: string
}

/**
 * Generates a manifest of TS configuration and validates its input.
 * @param values
 */
function validateConfiguration(
  config: LSConfiguration,
): Either<Array<ConfigurationValidationError>, LSConfiguration> {
  /* Helper functions */
  const repos = Object.keys(config.repos)
  const repo = (name: string): LSRepository => config.repos[name]!

  /* Validator */
  const errors = repos.reduce((acc, repoName) => {
    const repoConfig = repo(repoName)
    const labels = Object.keys(repoConfig.labels)
    const label = (name: string): LSLabel => repoConfig.labels[name]!

    /* Check whether repository configuration defines all siblings. */
    const labelsWithMissingSiblings = filterMap<
      string,
      ConfigurationValidationError
    >(labelName => {
      const labelConfig = label(labelName)
      const missingSiblings = labelConfig.siblings.filter(sibling =>
        labels.some(label => label === sibling),
      )

      if (missingSiblings.length > 0) {
        return some({
          path: [repoName, labelName],
          value: missingSiblings,
          message: `Some of the labels are missing in configuration.`,
        })
      } else {
        return none
      }
    })

    return acc.concat(labelsWithMissingSiblings)
  }, [])

  if (errors.length > 0) {
    return left(errors)
  }

  return right(config)
}

/* Github related stuff. */

export type LSConfigurationParams = {
  owner: string
  repo: string
  ref: string
}

/**
 * Attempts to load configuration file from Github.
 *
 * @param octokit
 * @param params
 */
export async function loadYAMLConfigFile(
  octokit: Octokit,
  { owner, repo, ref }: LSConfigurationParams,
): Promise<Either<string, any>> {
  /**
   * Attempts to load a single file configuraiton from Github.
   */
  const rawConfig = await octokit.repos.getContents({
    owner: owner,
    path: labelSyncConfigurationFilePath,
    repo: repo,
    ref: ref,
  })

  switch (rawConfig.status) {
    case 200: {
      /* Validate configuration file. */
      if (Array.isArray(rawConfig.data) || !rawConfig.data.content) {
        return left(`received a list instead of a file.`)
      } else {
        const buffer = Buffer.from(rawConfig.data.content, 'base64').toString()
        const yamlConfig = yaml.parse(buffer, {})

        return right(yamlConfig)
        // const config = validateYAMLConfiguration(yamlConfig)

        // if (config.type === 'left') {
        //   /* Something failed miserably. */
        //   /**
        //    * Don't do anything for now. Eventually, we want to open an issue
        //    * explaining what went wrong.
        //    */
        // } else {
        //   /* Everything is fine with your configuraiton. */
        //   /**
        //    * Seems like you know what you're doing, we'll sync all your settings.
        //    */
        // }
      }
    }
    default: {
      return left('Something unexpected happened.')
      /* Process the error status. */
      log(rawConfig.data)
    }
  }
}
