import * as a from 'fp-ts/lib/Array'
import * as e from 'fp-ts/lib/Either'
import * as o from 'fp-ts/lib/Option'
import { Task } from 'fp-ts/lib/Task'
import * as t from 'io-ts'
import { Octokit } from 'probot'
import yaml from 'yaml'

import { labelSyncConfigurationFilePath } from '../constants'

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

export type LSConfigurationError =
  | LSConfigurationLocationError
  | LSConfigurationShapeError
  | LSConfigurationContentError

/* Problems with configuration file location on Github. */
export type LSConfigurationLocationError =
  | {
      type: 'LOCATION'
      context: Octokit.Response<Octokit.ReposGetContentsResponse>
      kind: 'FILE_TYPE' | 'CONNECTION'
      message?: string
    }
  | {
      type: 'LOCATION'
      kind: 'OTHER'
      error: Error
    }

/* Wrong file structure. */
export type LSConfigurationShapeError = {
  type: 'SHAPE'
  fields: Array<{
    path: string[]
    message?: string
  }>
}

/* Problems with configuration content. */
export type LSConfigurationContentError = {
  type: 'CONTENT'
  missing: Array<{
    path: string[]
    siblings: string[]
  }>
}

/**
 * Processes a decoded YAML configuration. It doesn't perform
 * any content checks.
 *
 * @param yaml
 */
export function validateYAMLConfiguration(
  yaml: object,
): e.Either<LSConfigurationError, LSConfiguration> {
  return e.mapLeft(validationErrorToLSConfigurationShapeError)(
    LSConfiguration.decode(yaml),
  )
}

/**
 * Converts ValidationError from io-ts to LSConfigurationError.
 *
 * @param errors
 */
function validationErrorToLSConfigurationShapeError(
  errors: Array<t.ValidationError>,
): LSConfigurationError {
  return { type: 'SHAPE', fields: errors.map(getError) }

  function getError(
    e: t.ValidationError,
  ): { path: string[]; message?: string } {
    return { path: e.context.map(c => c.key), message: e.message }
  }
}

/**
 * Validates configuration contents.
 *
 * @param config
 */
export function validateConfigurationContents(
  config: LSConfiguration,
): e.Either<LSConfigurationError, LSConfiguration> {
  /* Helper functions */
  const repos = Object.keys(config.repos)
  const repo = (name: string): LSRepository => config.repos[name]!

  /* Validator */
  const errors = a.reduce<
    string,
    Array<{ path: string[]; siblings: string[] }>
  >([], (acc, repoName) => {
    const repoConfig = repo(repoName)
    const labels = Object.keys(repoConfig.labels)
    const label = (name: string): LSLabel => repoConfig.labels[name]!

    /* Check whether repository configuration defines all siblings. */
    const labelsWithMissingSiblings = a.filterMap<
      string,
      { path: string[]; siblings: string[] }
    >(labelName => {
      const labelConfig = label(labelName)
      const missingSiblings = labelConfig.siblings.filter(sibling =>
        labels.some(label => label === sibling),
      )

      if (missingSiblings.length > 0) {
        return o.some({
          path: [repoName, labelName],
          siblings: missingSiblings,
        })
      } else {
        return o.none
      }
    })(labels)

    return acc.concat(labelsWithMissingSiblings)
  })(repos)

  if (errors.length > 0) {
    return e.left({ type: 'CONTENT', missing: errors })
  }

  return e.right(config)
}

export interface LSConfigurationParams {
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
export const loadYAMLConfigFile = (
  octokit: Octokit,
  { owner, repo, ref }: LSConfigurationParams,
): Task<e.Either<LSConfigurationLocationError, any>> => async () => {
  try {
    const res = await octokit.repos.getContents({
      owner: owner,
      path: labelSyncConfigurationFilePath,
      repo: repo,
      ref: ref,
    })

    switch (res.status) {
      case 200: {
        /* Validate configuration file. */
        if (Array.isArray(res.data) || !res.data.content) {
          return e.left({ type: 'LOCATION', context: res, kind: 'FILE_TYPE' })
        } else {
          const buffer = Buffer.from(res.data.content, 'base64').toString()
          const yamlConfig = yaml.parse(buffer, {})

          return e.right(yamlConfig)
        }
      }
      default: {
        /* Process the error. */
        return e.left({ type: 'LOCATION', kind: 'CONNECTION', context: res })
      }
    }
  } catch (err) {
    return e.left({ type: 'LOCATION', kind: 'OTHER', error: err })
  }
}
