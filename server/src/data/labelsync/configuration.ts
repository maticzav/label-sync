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
 * Represents a repository which is closed on itself.
 *
 * Checks:
 *  * every sibling has a repository definition.
 */
interface LSWellConfiguredRepositoryBrand {
  readonly LSWellConfiguredRepository: unique symbol
}
const LSWellConfiguredRepository = t.brand(
  LSRepository, // a codec representing the original type
  (repo): repo is t.Branded<LSRepository, LSWellConfiguredRepositoryBrand> => {
    const labelsNames = Object.keys(repo.labels)
    /* Check whether repository configuration defines all siblings. */
    return labelsNames.some(labelName => {
      const label = repo.labels[labelName]!
      return label.siblings.some(sibling =>
        labelsNames.some(label => label !== sibling),
      )
    })
  },
  'LSWellConfiguredRepository',
)

/**
 * Configuration represents an entire configuration for all
 * LabelSync tools that an organisation is using.
 */
const LSConfiguration = t.type({
  repos: t.record(LSRepositoryName, LSWellConfiguredRepository),
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

/* Github related stuff. */

export interface LSConfigurationParams {
  owner: string
  repo: string
  ref: string
}

export interface LoadYamlConfigFileError {
  type: 'FILE_TYPE' | 'CONNECTION' | 'OTHER'
  context: Octokit.Response<Octokit.ReposGetContentsResponse>
  message?: string
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
): Promise<Either<LoadYamlConfigFileError, any>> {
  /**
   * Attempts to load a single file configuraiton from Github.
   */
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
        return left({ type: 'FILE_TYPE', context: res })
      } else {
        const buffer = Buffer.from(res.data.content, 'base64').toString()
        const yamlConfig = yaml.parse(buffer, {})

        return right(yamlConfig)
      }
    }
    default: {
      /* Process the error. */
      return left({ type: 'CONNECTION', context: res })
    }
  }
}
