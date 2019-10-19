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
 * "Configuration" = "LSC"-prefix
 */

/* Types */

/**
 * Sibling represents a label that LabelSync should add whenever
 * a parent label is assigned to issues or pull request.
 * Siblings can only refer to labels also defined in LabelSync repository
 * configuration.
 */
const LSCSibling = t.string
export type LSCSibling = t.TypeOf<typeof LSCSibling>

/**
 * Represents a label hook. LabelSync triggers a label hook
 * every time a hook is added to an issues or a pull request.
 */
const LSCHook = t.union([
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
export type LSCHook = t.TypeOf<typeof LSCHook>

/**
 * Label represents the central unit of LabelSync. Each label
 * can have multiple siblings that are meaningfully related to
 * a label itself, multiple hooks that trigger different actions.
 */
const LSCLabel = t.type({
  description: t.string,
  color: t.string,
  siblings: t.array(LSCSibling),
  hooks: t.array(LSCHook),
})
export type LSCLabel = t.TypeOf<typeof LSCLabel>

const LSCLabelName = t.string
export type LSCLabelName = t.TypeOf<typeof LSCLabelName>

/**
 * Repository represents a single Github repository.
 * When configured as `strict` it will delete any surplus of labels
 * in the repository.
 */
const LSCRepository = t.type({
  strict: t.boolean,
  labels: t.record(LSCLabelName, LSCLabel),
})
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

/* Validation */

export type LSCConfigurationError =
  | LSCConfigurationLocationError
  | LSCConfigurationShapeError
  | LSCConfigurationContentError

/* Problems with configuration file location on Github. */
export type LSCConfigurationLocationError =
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
export type LSCConfigurationShapeError = {
  type: 'SHAPE'
  fields: Array<{
    path: string[]
    message?: string
  }>
}

/* Problems with configuration content. */
export type LSCConfigurationContentError = {
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
export function validateConfigurationShape(
  yaml: object,
): e.Either<LSCConfigurationError, LSCConfiguration> {
  return e.mapLeft(validationErrorToLSCConfigurationShapeError)(
    LSCConfiguration.decode(yaml),
  )
}

/**
 * Converts ValidationError from io-ts to LSCConfigurationError.
 *
 * @param errors
 */
function validationErrorToLSCConfigurationShapeError(
  errors: Array<t.ValidationError>,
): LSCConfigurationError {
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
  config: LSCConfiguration,
): e.Either<LSCConfigurationError, LSCConfiguration> {
  /* Helper functions */
  const repos = Object.keys(config.repos)
  const repo = (name: string): LSCRepository => config.repos[name]!

  /* Validator */
  const errors = a.reduce<
    string,
    Array<{ path: string[]; siblings: string[] }>
  >([], (acc, repoName) => {
    const repoConfig = repo(repoName)
    const labels = Object.keys(repoConfig.labels)
    const label = (name: string): LSCLabel => repoConfig.labels[name]!

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

export interface LSCConfigurationParams {
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
  { owner, repo, ref }: LSCConfigurationParams,
): Task<e.Either<LSCConfigurationLocationError, any>> => async () => {
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
