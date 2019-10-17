import joi, { ValidationError } from '@hapi/joi'
import debug from 'debug'
import { Context, Octokit } from 'probot'
import yaml from 'yaml'

import { labelSyncConfigurationFilePath } from '../constants'
import { Either, left, right } from '../either'

/* File logger. */

const log = debug('data:configuration')

/**
 * Every type that is related to configuration.
 *
 * "Configuration" = "LS"-prefix
 */

/* Types */

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
  color: LSLabelColor
  siblings: LSSibling[]
  hooks: LSHook[]
}
export type LSLabelName = string
export type LSLabelColor = string

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

/* Schema */

const lsSibling = joi.string()

const lsHook = joi.alternatives(
  /* Webhook integration */
  joi.object().keys({
    integration: 'webhook',
    enpoint: joi
      .string()
      .uri()
      .required(),
  }),
  /* Slack integrations */
  joi.object().keys({
    integration: 'slack',
    action: 'notify',
    user: joi.string().required(),
  }),
  /* PR manager */
  joi.object().keys({
    integration: 'pr',
    action: joi.alternatives('merge', 'close'),
  }),
)

const lsLabel = joi.object().keys({
  description: joi.string(),
  color: joi
    .string()
    .regex(/\#\w\w\w\w\w\w/)
    .required(),
  siblings: joi
    .array()
    .items(lsSibling)
    .default([]),
  hooks: joi
    .array()
    .items(lsHook)
    .default([]),
})

const lsRepository = joi.object().keys({
  strict: joi.boolean().default(false),
  labels: joi
    .object()
    .pattern(/.*/, lsLabel)
    .required(),
})

const lsConfiguration = joi.object().keys({
  repos: joi
    .object()
    .pattern(/.*/, lsRepository)
    .required(),
})

/* Validation */

/**
 * Processes a decoded YAML configuration. It doesn't perform
 * any content checks.
 *
 * @param yaml
 */
export function validateYAMLConfiguration(
  yaml: object,
): Either<ValidationError, LSConfiguration> {
  const { error, errors, value } = lsConfiguration.validate(yaml)
  // TODO: wtf.

  if (error) return left(error)
  return right(value)
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
export async function loadYAMLLSConfiguration(
  octokit: Octokit,
  { owner, repo, ref }: LSConfigurationParams,
) {
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
        return left('')
        log(`received a list instead of a file.`)
      } else {
        const buffer = Buffer.from(rawConfig.data.content, 'base64').toString()
        const yamlConfig = yaml.parse(buffer, {})
        const config = validateYAMLConfiguration(yamlConfig)

        if (config.type === 'left') {
          /* Something failed miserably. */
          /**
           * Don't do anything for now. Eventually, we want to open an issue
           * explaining what went wrong.
           */
        } else {
          /* Everything is fine with your configuraiton. */
          /**
           * Seems like you know what you're doing, we'll sync all your settings.
           */
        }
      }
    }
    default: {
      /* Process the error status. */
      log(rawConfig.data)
    }
  }
}
